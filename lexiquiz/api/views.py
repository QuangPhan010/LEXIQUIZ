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

        return Response({
            "quizzes_created": quizzes_created,
            "results_taken": results_taken,
            "avg_score": round(avg_score, 1),
            "badges": badges_data
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

            # Update XP (Ensure profile exists)
            profile, created = Profile.objects.get_or_create(user=self.request.user)
            profile.xp += correct_count * 10
            import math
            profile.level = math.floor(math.sqrt(profile.xp / 100)) + 1
            profile.save()

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
                'level': p.level
            })
        return Response(data)
