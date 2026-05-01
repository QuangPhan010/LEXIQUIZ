from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Quiz, Question, Choice, Result
from .serializers import QuizSerializer, QuizDetailSerializer, QuestionSerializer, ResultSerializer, UserSerializer

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

class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    
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
        answers = request.data.get('answers') # List of {question_id, choice_id}

        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=status.HTTP_404_NOT_FOUND)

        questions = quiz.questions.all()
        total_questions = questions.count()
        correct_count = 0

        # Simple scoring logic
        for q in questions:
            user_choice_id = answers.get(str(q.id))
            if user_choice_id:
                try:
                    choice = Choice.objects.get(id=user_choice_id, question=q)
                    if choice.is_correct:
                        correct_count += 1
                except Choice.DoesNotExist:
                    pass

        result = Result.objects.create(
            user=self.request.user,
            quiz=quiz,
            score=correct_count,
            total_questions=total_questions
        )

        return Response(ResultSerializer(result).data, status=status.HTTP_201_CREATED)
