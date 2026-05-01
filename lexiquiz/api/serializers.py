from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Quiz, Question, Choice, Result

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ('id', 'text', 'is_correct')

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True)

    class Meta:
        model = Question
        fields = ('id', 'text', 'order', 'choices')

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)
    questions_count = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ('id', 'title', 'description', 'created_at', 'creator', 'questions', 'questions_count')
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

    class Meta:
        model = Quiz
        fields = ('id', 'title', 'description', 'created_at', 'creator', 'questions')

class ResultSerializer(serializers.ModelSerializer):
    quiz_title = serializers.ReadOnlyField(source='quiz.title')

    class Meta:
        model = Result
        fields = ('id', 'user', 'quiz', 'quiz_title', 'score', 'total_questions', 'completed_at')
        read_only_fields = ('user', 'completed_at')
