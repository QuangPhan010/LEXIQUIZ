import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Quiz, Question, Choice

class DuelConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'duel_{self.room_name}'
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'join':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'duel_message',
                    'message': {
                        'type': 'player_joined',
                        'username': self.user.username,
                        'avatar': self.user.profile.avatar.url if self.user.profile.avatar else None
                    }
                }
            )
        
        elif action == 'start_game':
            quiz_id = data.get('quiz_id')
            quiz_data = await self.get_quiz_data(quiz_id)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'duel_message',
                    'message': {
                        'type': 'game_started',
                        'quiz': quiz_data
                    }
                }
            )

        elif action == 'submit_answer':
            score = data.get('score')
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'duel_message',
                    'message': {
                        'type': 'score_update',
                        'username': self.user.username,
                        'score': score
                    }
                }
            )
        
        elif action == 'finish':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'duel_message',
                    'message': {
                        'type': 'player_finished',
                        'username': self.user.username,
                        'score': data.get('score'),
                        'time': data.get('time')
                    }
                }
            )

    # Receive message from room group
    async def duel_message(self, event):
        message = event['message']
        # Send message to WebSocket
        await self.send(text_data=json.dumps(message))

    @sync_to_async
    def get_quiz_data(self, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id)
            questions = quiz.questions.all().order_by('order')
            data = {
                'id': quiz.id,
                'title': quiz.title,
                'questions': []
            }
            for q in questions:
                choices = [{'id': c.id, 'text': c.text, 'is_correct': c.is_correct} for c in q.choices.all()]
                data['questions'].append({
                    'id': q.id,
                    'text': q.text,
                    'choices': choices,
                    'type': q.question_type
                })
            return data
        except Quiz.DoesNotExist:
            return None
