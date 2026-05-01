from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Quiz, Question, Choice, Result, Category, Profile, UserAnswer
from .serializers import QuizSerializer, QuizDetailSerializer, QuestionSerializer, ResultSerializer, UserSerializer, CategorySerializer, UserAnswerSerializer

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

    @action(detail=False, methods=['get'])
    def me(self, request):
        if request.user.is_authenticated:
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        return Response({"error": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

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

class ResultViewSet(viewsets.ModelViewSet):
    serializer_class = ResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Result.objects.filter(user=self.request.user).order_by('-completed_at')

    @action(detail=False, methods=['post'])
    def submit(self, request):
        quiz_id = request.data.get('quiz_id')
        answers_data = request.data.get('answers') # Dict of {question_id: choice_id}
        duration = request.data.get('duration', 0)

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

        for q in questions:
            user_choice_id = answers_data.get(str(q.id))
            choice = None
            if user_choice_id:
                try:
                    choice = Choice.objects.get(id=user_choice_id, question=q)
                    if choice.is_correct:
                        correct_count += 1
                except Choice.DoesNotExist:
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

        # Update XP
        profile = self.request.user.profile
        profile.xp += correct_count * 10
        # Simple level up logic: level = floor(sqrt(xp/100)) + 1
        import math
        profile.level = math.floor(math.sqrt(profile.xp / 100)) + 1
        profile.save()

        return Response(ResultSerializer(result).data, status=status.HTTP_201_CREATED)

class LeaderboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def list(self, request):
        profiles = Profile.objects.all().order_by('-xp')[:20]
        data = []
        for p in profiles:
            data.append({
                'username': p.user.username,
                'xp': p.xp,
                'level': p.level
            })
        return Response(data)
