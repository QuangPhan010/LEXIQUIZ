from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Quiz, Question, Choice, Result, Category, Profile, UserAnswer

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    xp = serializers.ReadOnlyField(source='profile.xp')
    level = serializers.ReadOnlyField(source='profile.level')

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'xp', 'level')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class CategorySerializer(serializers.ModelSerializer):
    quizzes_count = serializers.IntegerField(source='quizzes.count', read_only=True)
    
    class Meta:
        model = Category
        fields = ('id', 'name', 'icon', 'quizzes_count')

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ('id', 'text', 'is_correct')

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True)

    class Meta:
        model = Question
        fields = ('id', 'text', 'order', 'choices', 'question_type')

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)
    questions_count = serializers.SerializerMethodField()
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Quiz
        fields = (
            'id', 'title', 'description', 'created_at', 'creator', 
            'questions', 'questions_count', 'category', 'category_name',
            'is_public', 'time_limit', 'tags'
        )
        read_only_fields = ('creator',)

    def get_questions_count(self, obj):
        return obj.questions.count()

    def create(self, validated_data):
        questions_data = validated_data.pop('questions')
        quiz = Quiz.objects.create(**validated_data)
        for question_data in questions_data:
            choices_data = question_data.pop('choices')
            question = Question.objects.create(quiz=quiz, **question_data)
            for choice_data in choices_data:
                Choice.objects.create(question=question, **choice_data)
        return quiz

class QuizDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Quiz
        fields = (
            'id', 'title', 'description', 'created_at', 'creator', 
            'questions', 'category', 'category_name', 'is_public', 
            'time_limit', 'tags'
        )

class UserAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.ReadOnlyField(source='question.text')
    selected_choice_text = serializers.ReadOnlyField(source='selected_choice.text')
    correct_choice_id = serializers.SerializerMethodField()
    correct_choice_text = serializers.SerializerMethodField()

    class Meta:
        model = UserAnswer
        fields = ('id', 'question', 'question_text', 'selected_choice', 'selected_choice_text', 'correct_choice_id', 'correct_choice_text')

    def get_correct_choice_id(self, obj):
        correct_choice = obj.question.choices.filter(is_correct=True).first()
        return correct_choice.id if correct_choice else None

    def get_correct_choice_text(self, obj):
        correct_choice = obj.question.choices.filter(is_correct=True).first()
        return correct_choice.text if correct_choice else None

class ResultSerializer(serializers.ModelSerializer):
    quiz_title = serializers.ReadOnlyField(source='quiz.title')
    answers = UserAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Result
        fields = ('id', 'user', 'quiz', 'quiz_title', 'score', 'total_questions', 'duration', 'completed_at', 'answers')
        read_only_fields = ('user', 'completed_at')
