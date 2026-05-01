from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Count, Avg, Q
from .models import (
    Quiz, Question, Choice, Result, Category, Profile, UserAnswer,
    DailyQuest, UserQuest, Item, UserInventory, SkillXP,
    QuizRating, Comment, Follow
)
from .serializers import (
    QuizSerializer, QuizDetailSerializer, QuestionSerializer, 
    ResultSerializer, UserSerializer, CategorySerializer, 
    UserAnswerSerializer, DailyQuestSerializer, UserQuestSerializer,
    ItemSerializer, UserInventorySerializer, SkillXPSerializer,
    CommentSerializer, QuizRatingSerializer
)
from datetime import date, timedelta
from django.utils import timezone
import math

def ensure_daily_quests(user):
    today = date.today()
    if not UserQuest.objects.filter(user=user, date=today).exists():
        # Assign 3 random active quests
        quests = DailyQuest.objects.filter(is_active=True).order_by('?')[:3]
        for q in quests:
            UserQuest.objects.create(user=user, quest=q, date=today)

class AuthViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        if not request.user.is_authenticated:
            return Response({"error": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
        
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            user = request.user
            profile = user.profile
            
            # Update User fields
            username = request.data.get('username')
            email = request.data.get('email')
            if username:
                user.username = username
            if email:
                user.email = email
            user.save()
            
            # Update Profile fields (avatar)
            avatar = request.FILES.get('avatar')
            if avatar:
                profile.avatar = avatar
                profile.save()
                
            serializer = self.get_serializer(user)
            return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def follow(self, request, pk=None):
        target_user = User.objects.get(pk=pk)
        if target_user == request.user:
            return Response({"error": "Cannot follow yourself"}, status=status.HTTP_400_BAD_REQUEST)
        
        follow, created = Follow.objects.get_or_create(follower=request.user, following=target_user)
        if not created:
            follow.delete()
            return Response({"message": "Unfollowed", "is_following": False})
        return Response({"message": "Followed", "is_following": True})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        if not request.user.is_authenticated:
            return Response({"error": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
            
        user = request.user
        quizzes_created = Quiz.objects.filter(creator=user).count()
        results_taken = Result.objects.filter(user=user).count()
        
        # Calculate average score percentage
        results = Result.objects.filter(user=user)
        avg_score = 0
        if results.exists():
            total_percentage = sum((r.score / r.total_questions) * 100 for r in results if r.total_questions > 0)
            avg_score = total_percentage / results_taken
            
        # Badge Definitions
        all_badges = [
            {"id": "explorer", "name": "Explorer", "icon": "Compass", "color": "blue", "requirement": "Reach Level 5"},
            {"id": "veteran", "name": "Veteran", "icon": "Shield", "color": "purple", "requirement": "Reach Level 10"},
            {"id": "architect", "name": "Architect", "icon": "Layout", "color": "emerald", "requirement": "Create your first quiz"},
            {"id": "mastermind", "name": "Mastermind", "icon": "Brain", "color": "rose", "requirement": "Create 5 or more quizzes"},
            {"id": "scholar", "name": "Scholar", "icon": "GraduationCap", "color": "amber", "requirement": "Complete 10 or more quizzes"},
            {"id": "genius", "name": "Genius", "icon": "Sparkles", "color": "indigo", "requirement": "Avg score 90%+ on at least 3 quizzes"},
        ]
        
        badges_data = []
        for b in all_badges:
            earned = False
            if b["id"] == "explorer" and user.profile.level >= 5: earned = True
            elif b["id"] == "veteran" and user.profile.level >= 10: earned = True
            elif b["id"] == "architect" and quizzes_created >= 1: earned = True
            elif b["id"] == "mastermind" and quizzes_created >= 5: earned = True
            elif b["id"] == "scholar" and results_taken >= 10: earned = True
            elif b["id"] == "genius" and avg_score >= 90 and results_taken >= 3: earned = True
            
            b["earned"] = earned
            badges_data.append(b)

        # Category Breakdown
        category_stats = Result.objects.filter(user=user).values(
            'quiz__category__name'
        ).annotate(
            count=Count('id'),
            avg_accuracy=Avg('score') # This is just absolute score, but good enough for trend
        ).order_by('-count')

        return Response({
            "quizzes_created": quizzes_created,
            "results_taken": results_taken,
            "avg_score": round(avg_score, 1),
            "badges": badges_data,
            "category_stats": list(category_stats)
        })

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

from .utils import extract_text_from_pdf, extract_text_from_docx, generate_quiz_from_text

class QuizViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        # Public quizzes or quizzes created by the user
        from django.db.models import Q
        if self.request.user.is_authenticated:
            return Quiz.objects.filter(Q(is_public=True) | Q(creator=self.request.user)).distinct()
        return Quiz.objects.filter(is_public=True)
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return QuizDetailSerializer
        return QuizSerializer

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=False, methods=['get'])
    def my_quizzes(self, request):
        quizzes = Quiz.objects.filter(creator=request.user).order_by('-created_at')
        serializer = QuizSerializer(quizzes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def generate_from_file(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if file.name.endswith('.pdf'):
                text = extract_text_from_pdf(file)
            elif file.name.endswith('.docx'):
                text = extract_text_from_docx(file)
            else:
                return Response({"error": "Unsupported file format"}, status=status.HTTP_400_BAD_REQUEST)

            if not text.strip():
                return Response({"error": "No text could be extracted from the file"}, status=status.HTTP_400_BAD_REQUEST)

            quiz_data = generate_quiz_from_text(text)
            return Response(quiz_data)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ResultViewSet(viewsets.ModelViewSet):
    serializer_class = ResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Result.objects.filter(user=self.request.user).order_by('-completed_at')

    @action(detail=False, methods=['post'])
    def submit(self, request):
        print(f"DEBUG: Submit received data: {request.data}")
        quiz_id = request.data.get('quiz_id')
        answers_data = request.data.get('answers', {}) # Dict of {question_id: choice_id}
        duration = request.data.get('duration', 0)

        try:
            try:
                quiz = Quiz.objects.get(id=quiz_id)
            except Quiz.DoesNotExist:
                return Response({"error": "Quiz not found"}, status=status.HTTP_404_NOT_FOUND)

            questions = quiz.questions.all()
            total_questions = questions.count()
            correct_count = 0

            # Create Result first
            result = Result.objects.create(
                user=self.request.user,
                quiz=quiz,
                score=0, # Will update after checking
                total_questions=total_questions,
                duration=duration
            )

            if not isinstance(answers_data, dict):
                print(f"DEBUG: answers_data is not a dict: {type(answers_data)}")
                answers_data = {}

            for q in questions:
                user_choice_id = answers_data.get(str(q.id))
                choice = None
                if user_choice_id:
                    try:
                        choice = Choice.objects.get(id=user_choice_id, question=q)
                        if choice.is_correct:
                            correct_count += 1
                    except (Choice.DoesNotExist, ValueError, TypeError):
                        print(f"DEBUG: Choice not found or invalid ID: {user_choice_id} for question {q.id}")
                        pass
                
                # Save UserAnswer
                UserAnswer.objects.create(
                    result=result,
                    question=q,
                    selected_choice=choice
                )

            # Update Result score
            result.score = correct_count
            result.save()

            # --- GAMIFICATION LOGIC ---
            profile, created = Profile.objects.get_or_create(user=self.request.user)
            
            # 1. Award Coins: 10 per correct answer
            earned_coins = correct_count * 10
            profile.coins += earned_coins
            
            # 2. Award XP & Level Up
            profile.xp += correct_count * 10
            profile.level = math.floor(math.sqrt(profile.xp / 100)) + 1
            
            # 3. Streak Logic
            today = date.today()
            if profile.last_active == today - timedelta(days=1):
                profile.streak_count += 1
            elif profile.last_active < today - timedelta(days=1):
                profile.streak_count = 1
            # If last_active is today, streak remains same
            profile.last_active = today
            profile.save()

            # 4. Skill Tree XP
            if quiz.category:
                skill_xp, _ = SkillXP.objects.get_or_create(user=self.request.user, category=quiz.category)
                skill_xp.xp += correct_count * 10
                skill_xp.level = math.floor(math.sqrt(skill_xp.xp / 100)) + 1
                skill_xp.save()

            # 5. Quest Progress
            # Ensure user has daily quests
            ensure_daily_quests(self.request.user)
            
            active_user_quests = UserQuest.objects.filter(user=self.request.user, is_completed=False, date=today)
            for uq in active_user_quests:
                quest = uq.quest
                if quest.quest_type == 'QUIZ_COUNT':
                    uq.progress += 1
                elif quest.quest_type == 'XP_GAIN':
                    uq.progress += (correct_count * 10)
                elif quest.quest_type == 'SCORE_AVG':
                    percentage = (correct_count / total_questions) * 100 if total_questions > 0 else 0
                    if percentage >= quest.requirement_value:
                        uq.progress = quest.requirement_value # Mark as done
                
                if uq.progress >= quest.requirement_value:
                    uq.is_completed = True
                uq.save()

            serializer = ResultSerializer(result)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"DEBUG: Submit error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LeaderboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def list(self, request):
        profiles = Profile.objects.all().order_by('-xp')[:20]
        data = []
        for p in profiles:
            data.append({
                'username': p.user.username,
                'xp': p.xp,
                'level': p.level,
                'streak': p.streak_count
            })
        return Response(data)

class QuestViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserQuestSerializer

    def get_queryset(self):
        # Ensure quests exist for today
        ensure_daily_quests(self.request.user)
        return UserQuest.objects.filter(user=self.request.user, date=date.today())

    @action(detail=True, methods=['post'])
    def claim(self, request, pk=None):
        uq = self.get_object()
        if uq.is_completed and not uq.is_claimed:
            uq.is_claimed = True
            uq.save()
            
            profile = request.user.profile
            profile.coins += uq.quest.reward_coins
            profile.xp += uq.quest.reward_xp
            profile.level = math.floor(math.sqrt(profile.xp / 100)) + 1
            profile.save()
            
            return Response({"message": "Rewards claimed!", "coins": profile.coins, "xp": profile.xp})
        return Response({"error": "Cannot claim rewards"}, status=status.HTTP_400_BAD_REQUEST)

class ShopViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def buy(self, request, pk=None):
        item = self.get_object()
        profile = request.user.profile
        
        if UserInventory.objects.filter(user=request.user, item=item).exists():
            return Response({"error": "Already owned"}, status=status.HTTP_400_BAD_REQUEST)
            
        if profile.coins >= item.price:
            profile.coins -= item.price
            profile.save()
            UserInventory.objects.create(user=request.user, item=item)
            return Response({"message": "Purchase successful!", "coins": profile.coins})
        return Response({"error": "Not enough coins"}, status=status.HTTP_400_BAD_REQUEST)

class InventoryViewSet(viewsets.ModelViewSet):
    serializer_class = UserInventorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserInventory.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def equip(self, request, pk=None):
        inv_item = self.get_object()
        # Unequip others of same type if needed? 
        # For now just toggle
        inv_item.is_equipped = not inv_item.is_equipped
        inv_item.save()
        return Response({"is_equipped": inv_item.is_equipped})

class SkillXPViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SkillXPSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SkillXP.objects.filter(user=self.request.user).order_by('-level', '-xp')

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        quiz_id = self.request.query_params.get('quiz_id')
        if quiz_id:
            return Comment.objects.filter(quiz_id=quiz_id).order_by('-created_at')
        return Comment.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class QuizRatingViewSet(viewsets.ModelViewSet):
    serializer_class = QuizRatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return QuizRating.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Update or create
        user = self.request.user
        quiz = serializer.validated_data['quiz']
        rating = serializer.validated_data['rating']
        
        QuizRating.objects.update_or_create(
            user=user, quiz=quiz,
            defaults={'rating': rating}
        )
