import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Quiz, GameRoom

# In-memory room state: { pin: { ... } }
# Structure:
# {
#   pin: {
#     host_channel: str,
#     players: { username: { username, avatar, score, is_host, channel_name } },
#     state: 'lobby' | 'question' | 'reveal' | 'leaderboard' | 'finished',
#     current_question: int,
#     quiz_data: { ... },
#     timer_task: asyncio.Task | None,
#     answers_this_round: { username: { choice_id, time_taken } }
#   }
# }
game_rooms = {}


class KahootConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.pin = self.scope['url_route']['kwargs']['pin']
        self.room_group_name = f'kahoot_{self.pin}'
        self.user = self.scope['user']
        # Guest support: allow anonymous but give them a temporary name via query param
        query_string = self.scope.get('query_string', b'').decode()
        params = dict(x.split('=') for x in query_string.split('&') if '=' in x)
        self.guest_name = params.get('guest_name', '').strip()
        self.is_guest = self.user.is_anonymous

        if self.is_guest and not self.guest_name:
            await self.close()
            return

        self.display_name = self.guest_name if self.is_guest else self.user.username

        # Validate room exists
        room_exists = await self.check_room_exists()
        if not room_exists:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if self.pin in game_rooms:
            room = game_rooms[self.pin]
            room['players'].pop(self.display_name, None)

            # If host disconnects, notify everyone
            if room.get('host_channel') == self.channel_name:
                # Cancel timer if running
                if room.get('timer_task') and not room['timer_task'].done():
                    room['timer_task'].cancel()
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {'type': 'kahoot_message', 'message': {'type': 'host_left'}}
                )
            else:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'kahoot_message',
                        'message': {
                            'type': 'player_left',
                            'username': self.display_name,
                            'players': self._get_players_list(room),
                        }
                    }
                )
            if not room['players']:
                # Cancel timer and clean up empty room
                if room.get('timer_task') and not room['timer_task'].done():
                    room['timer_task'].cancel()
                del game_rooms[self.pin]

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except Exception:
            return
        action = data.get('action')

        if action == 'join':
            await self._handle_join()
        elif action == 'start_game':
            await self._handle_start_game()
        elif action == 'submit_answer':
            await self._handle_submit_answer(data)
        elif action == 'kick_player':
            await self._handle_kick_player(data)

    # ─── Handlers ────────────────────────────────────────────────────────────

    async def _handle_join(self):
        avatar_url = None if self.is_guest else await self.get_avatar_url()
        is_host = await self.check_is_host()

        if self.pin not in game_rooms:
            game_rooms[self.pin] = {
                'host_channel': self.channel_name if is_host else None,
                'players': {},
                'state': 'lobby',
                'current_question': 0,
                'quiz_data': None,
                'timer_task': None,
                'answers_this_round': {},
            }
        
        room = game_rooms[self.pin]
        if is_host and not room['host_channel']:
            room['host_channel'] = self.channel_name

        room['players'][self.display_name] = {
            'username': self.display_name,
            'avatar': avatar_url,
            'score': 0,
            'is_host': is_host,
            'channel_name': self.channel_name,
        }

        # Broadcast to all: player joined + updated players list
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'kahoot_message',
                'message': {
                    'type': 'player_joined',
                    'username': self.display_name,
                    'avatar': avatar_url,
                    'is_host': is_host,
                    'players': self._get_players_list(room),
                }
            }
        )

        # Send current room state only to the joining player
        await self.send(text_data=json.dumps({
            'type': 'room_state',
            'state': room['state'],
            'players': self._get_players_list(room),
            'is_host': is_host,
            'pin': self.pin,
        }))

    async def _handle_start_game(self):
        if self.pin not in game_rooms:
            return
        room = game_rooms[self.pin]
        
        # Only host can start
        if room.get('host_channel') != self.channel_name:
            return
        if room['state'] != 'lobby':
            return

        quiz_data = await self.get_quiz_data()
        if not quiz_data or not quiz_data.get('questions'):
            return

        room['quiz_data'] = quiz_data
        room['state'] = 'question'
        room['current_question'] = 0
        room['answers_this_round'] = {}

        await self._broadcast_question(room)

    async def _handle_submit_answer(self, data):
        if self.pin not in game_rooms:
            return
        room = game_rooms[self.pin]
        if room['state'] != 'question':
            return
        # Only accept one answer per player per round
        if self.display_name in room['answers_this_round']:
            return

        choice_id = data.get('choice_id')
        time_taken = data.get('time_taken', 30)  # seconds taken to answer

        room['answers_this_round'][self.display_name] = {
            'choice_id': choice_id,
            'time_taken': time_taken,
        }

        # Acknowledge to this player
        await self.send(text_data=json.dumps({'type': 'answer_received'}))

        # Broadcast live answer count to host
        q_idx = room['current_question']
        question = room['quiz_data']['questions'][q_idx]
        total_players = len([p for p in room['players'].values() if not p['is_host']])
        answered = len(room['answers_this_round'])

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'kahoot_message',
                'message': {
                    'type': 'answer_count',
                    'answered': answered,
                    'total': total_players,
                }
            }
        )

        # If all players answered, reveal early
        if answered >= total_players and total_players > 0:
            if room.get('timer_task') and not room['timer_task'].done():
                room['timer_task'].cancel()
            await self._reveal_and_advance(room)

    async def _handle_kick_player(self, data):
        if self.pin not in game_rooms:
            return
        room = game_rooms[self.pin]
        if room.get('host_channel') != self.channel_name:
            return
        target = data.get('username')
        if target and target in room['players']:
            target_channel = room['players'][target]['channel_name']
            await self.channel_layer.send(target_channel, {
                'type': 'kahoot_message',
                'message': {'type': 'kicked'}
            })

    # ─── Game Flow ────────────────────────────────────────────────────────────

    async def _broadcast_question(self, room):
        q_idx = room['current_question']
        question = room['quiz_data']['questions'][q_idx]
        total_questions = len(room['quiz_data']['questions'])
        time_limit = question.get('time_limit_seconds', 10)

        # Send question to all (hide is_correct for players)
        safe_choices = [{'id': c['id'], 'text': c['text']} for c in question['choices']]

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'kahoot_message',
                'message': {
                    'type': 'show_question',
                    'question_index': q_idx,
                    'total_questions': total_questions,
                    'question': {
                        'id': question['id'],
                        'text': question['text'],
                        'image': question.get('image'),
                        'video_url': question.get('video_url', ''),
                        'time_limit_seconds': time_limit,
                        'choices': safe_choices,
                    },
                }
            }
        )

        # Start server-side countdown
        room['answers_this_round'] = {}
        task = asyncio.ensure_future(self._countdown_then_reveal(room, time_limit))
        room['timer_task'] = task

    async def _countdown_then_reveal(self, room, seconds):
        try:
            await asyncio.sleep(seconds)
            await self._reveal_and_advance(room)
        except asyncio.CancelledError:
            pass

    async def _reveal_and_advance(self, room):
        if room['state'] != 'question':
            return
        room['state'] = 'reveal'

        q_idx = room['current_question']
        question = room['quiz_data']['questions'][q_idx]
        correct_choice_id = next(
            (c['id'] for c in question['choices'] if c['is_correct']), None
        )
        time_limit = question.get('time_limit_seconds', 10)

        # Score players: base 1000pts, speed bonus
        results = {}
        for username, ans in room['answers_this_round'].items():
            is_correct = (ans['choice_id'] == correct_choice_id)
            if is_correct:
                speed_bonus = max(0, (time_limit - ans['time_taken']) / time_limit)
                points = int(1000 + 1000 * speed_bonus)
            else:
                points = 0
            results[username] = {'is_correct': is_correct, 'points': points}
            if username in room['players']:
                room['players'][username]['score'] += points

        # Build leaderboard
        leaderboard = self._get_leaderboard(room)

        # Broadcast reveal
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'kahoot_message',
                'message': {
                    'type': 'reveal_answer',
                    'correct_choice_id': correct_choice_id,
                    'results': results,
                    'leaderboard': leaderboard,
                    'question_index': q_idx,
                }
            }
        )

        # Wait 4 seconds then move to next question or finish
        await asyncio.sleep(4)

        total_questions = len(room['quiz_data']['questions'])
        next_idx = q_idx + 1

        if next_idx >= total_questions:
            # Game finished
            room['state'] = 'finished'
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'kahoot_message',
                    'message': {
                        'type': 'game_finished',
                        'leaderboard': leaderboard,
                    }
                }
            )
            # Mark room as inactive
            await self.deactivate_room()
        else:
            room['current_question'] = next_idx
            room['state'] = 'question'
            await self._broadcast_question(room)

    # ─── Helpers ──────────────────────────────────────────────────────────────

    def _get_players_list(self, room):
        return [
            {'username': p['username'], 'avatar': p['avatar'], 'score': p['score'], 'is_host': p['is_host']}
            for p in room['players'].values()
        ]

    def _get_leaderboard(self, room):
        players = [p for p in room['players'].values() if not p['is_host']]
        sorted_players = sorted(players, key=lambda p: p['score'], reverse=True)
        return [
            {'rank': i + 1, 'username': p['username'], 'avatar': p['avatar'], 'score': p['score']}
            for i, p in enumerate(sorted_players)
        ]

    async def kahoot_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    # ─── DB helpers ───────────────────────────────────────────────────────────

    @sync_to_async
    def check_room_exists(self):
        return GameRoom.objects.filter(pin=self.pin, is_active=True).exists()

    @sync_to_async
    def check_is_host(self):
        if self.is_guest:
            return False
        try:
            return GameRoom.objects.filter(pin=self.pin, host=self.user).exists()
        except Exception:
            return False

    @sync_to_async
    def get_avatar_url(self):
        try:
            profile = self.user.profile
            if profile.avatar:
                return profile.avatar.url
        except Exception:
            pass
        return None

    @sync_to_async
    def get_quiz_data(self):
        try:
            room = GameRoom.objects.get(pin=self.pin)
            quiz = room.quiz
            questions = quiz.questions.all().order_by('order')
            data = {
                'id': quiz.id,
                'title': quiz.title,
                'questions': []
            }
            for q in questions:
                choices = [
                    {'id': c.id, 'text': c.text, 'is_correct': c.is_correct}
                    for c in q.choices.all()
                ]
                data['questions'].append({
                    'id': q.id,
                    'text': q.text,
                    'image': q.image.url if q.image else None,
                    'video_url': q.video_url or '',
                    'time_limit_seconds': q.time_limit_seconds,
                    'choices': choices,
                    'type': q.question_type,
                })
            return data
        except GameRoom.DoesNotExist:
            return None

    @sync_to_async
    def deactivate_room(self):
        try:
            GameRoom.objects.filter(pin=self.pin).update(is_active=False)
        except Exception:
            pass


# Keep old DuelConsumer for backward compatibility
class DuelConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'duel_{self.room_name}'
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        pass

    async def duel_message(self, event):
        await self.send(text_data=json.dumps(event['message']))
