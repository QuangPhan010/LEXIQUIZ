from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Quiz, Question, Choice, Result, Category, Profile, UserAnswer,
    DailyQuest, UserQuest, Item, UserInventory, SkillXP,
    QuizRating, Comment, Follow, GameRoom
)

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    xp = serializers.ReadOnlyField(source='profile.xp')
    level = serializers.ReadOnlyField(source='profile.level')
    streak_count = serializers.ReadOnlyField(source='profile.streak_count')
    max_streak = serializers.ReadOnlyField(source='profile.max_streak')
    coins = serializers.ReadOnlyField(source='profile.coins')
    avatar = serializers.SerializerMethodField()
    is_streak_active = serializers.SerializerMethodField()

    equipped_frame = serializers.SerializerMethodField()
    frame_animation = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'xp', 'level', 'avatar', 'streak_count', 'max_streak', 'coins', 'is_streak_active', 'equipped_frame', 'frame_animation')

    def get_equipped_frame(self, obj):
        inventory = UserInventory.objects.filter(user=obj, item__item_type='FRAME', is_equipped=True).first()
        if inventory and inventory.item.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(inventory.item.image.url)
            return inventory.item.image.url
        return None

    def get_frame_animation(self, obj):
        inventory = UserInventory.objects.filter(user=obj, item__item_type='FRAME', is_equipped=True).first()
        if inventory and inventory.item.config:
            return inventory.item.config.get('animation', '')
        return ''

    def get_avatar(self, obj):
        profile = getattr(obj, 'profile', None)
        if profile and profile.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(profile.avatar.url)
            return profile.avatar.url
        return None

    def get_is_streak_active(self, obj):
        profile = getattr(obj, 'profile', None)
        if not profile:
            return False
        from django.utils import timezone
        return profile.last_active == timezone.now().date()

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
        fields = ('id', 'text', 'match_text', 'is_correct', 'order')

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ('id', 'text', 'order', 'choices', 'question_type', 'time_limit_seconds', 'image', 'video_url')

    def get_image(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)
    questions_count = serializers.SerializerMethodField()
    category_name = serializers.ReadOnlyField(source='category.name')
    creator_username = serializers.ReadOnlyField(source='creator.username')
    creator_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = (
            'id', 'title', 'description', 'created_at', 'creator',
            'creator_username', 'creator_avatar',
            'questions', 'questions_count', 'category', 'category_name',
            'is_public', 'time_limit', 'tags'
        )
        read_only_fields = ('creator',)

    def get_questions_count(self, obj):
        return obj.questions.count()

    def get_creator_avatar(self, obj):
        profile = getattr(obj.creator, 'profile', None)
        if profile and profile.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(profile.avatar.url)
            return profile.avatar.url
        return None

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
    comments = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = (
            'id', 'title', 'description', 'created_at', 'creator', 
            'questions', 'category', 'category_name', 'is_public', 
            'time_limit', 'tags', 'comments', 'avg_rating'
        )

    def get_comments(self, obj):
        comments = obj.comments.all().order_by('-created_at')[:20]
        return CommentSerializer(comments, many=True, context=self.context).data

    def get_avg_rating(self, obj):
        from django.db.models import Avg
        avg = obj.ratings.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0

class UserAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.ReadOnlyField(source='question.text')
    question_type = serializers.ReadOnlyField(source='question.question_type')
    selected_choice_text = serializers.SerializerMethodField()
    correct_choice_id = serializers.SerializerMethodField()
    correct_choice_text = serializers.SerializerMethodField()

    class Meta:
        model = UserAnswer
        fields = ('id', 'question', 'question_text', 'question_type', 'selected_choice', 'selected_choice_text', 'correct_choice_id', 'correct_choice_text', 'answer_data')

    def get_selected_choice_text(self, obj):
        try:
            if obj.question.question_type in ['MCQ', 'TF']:
                return obj.selected_choice.text if obj.selected_choice else None
            elif obj.question.question_type == 'ORDER':
                if isinstance(obj.answer_data, list):
                    # answer_data is a list of IDs
                    choices = {c.id: c.text for c in obj.question.choices.all()}
                    parts = []
                    for cid in obj.answer_data:
                        try:
                            cid_int = int(cid)
                            val = choices.get(cid_int)
                            parts.append(str(val) if val is not None else str(cid))
                        except (ValueError, TypeError):
                            parts.append(str(cid))
                    return " → ".join(parts)
                return None
            elif obj.question.question_type == 'MATCH':
                if isinstance(obj.answer_data, dict):
                    choices = {str(c.id): c.text for c in obj.question.choices.all()}
                    parts = []
                    for cid, val in obj.answer_data.items():
                        q_text = choices.get(str(cid))
                        parts.append(f"{q_text if q_text is not None else cid}: {val}")
                    return " | ".join(parts)
                return None
        except Exception as e:
            print(f"Error in get_selected_choice_text: {e}")
            return str(obj.answer_data)
        return None

    def get_correct_choice_id(self, obj):
        try:
            if obj.question.question_type in ['MCQ', 'TF']:
                correct_choice = obj.question.choices.filter(is_correct=True).first()
                return correct_choice.id if correct_choice else None
        except Exception:
            pass
        return None 

    def get_correct_choice_text(self, obj):
        try:
            if obj.question.question_type in ['MCQ', 'TF']:
                correct_choice = obj.question.choices.filter(is_correct=True).first()
                return correct_choice.text if correct_choice else None
            elif obj.question.question_type == 'ORDER':
                correct_order = obj.question.choices.all().order_by('order')
                return " → ".join([c.text for c in correct_order if c.text])
            elif obj.question.question_type == 'MATCH':
                choices = obj.question.choices.all()
                return " | ".join([f"{c.text}: {c.match_text}" for c in choices if c.text and c.match_text])
        except Exception as e:
            print(f"Error in get_correct_choice_text: {e}")
            return "Error loading correct answer"
        return None

class ResultSerializer(serializers.ModelSerializer):
    quiz_title = serializers.ReadOnlyField(source='quiz.title')
    answers = UserAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Result
        fields = ('id', 'user', 'quiz', 'quiz_title', 'score', 'total_questions', 'duration', 'completed_at', 'answers')
        read_only_fields = ('user', 'completed_at')

class ResultListSerializer(serializers.ModelSerializer):
    quiz_title = serializers.ReadOnlyField(source='quiz.title')

    class Meta:
        model = Result
        fields = ('id', 'user', 'quiz', 'quiz_title', 'score', 'total_questions', 'duration', 'completed_at')
        read_only_fields = ('user', 'completed_at')

class DailyQuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyQuest
        fields = ('id', 'title', 'description', 'quest_type', 'requirement_value', 'reward_coins', 'reward_xp', 'category', 'is_active')

class UserQuestSerializer(serializers.ModelSerializer):
    quest = DailyQuestSerializer(read_only=True)
    class Meta:
        model = UserQuest
        fields = '__all__'

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'

class UserInventorySerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    class Meta:
        model = UserInventory
        fields = '__all__'

class SkillXPSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    class Meta:
        model = SkillXP
        fields = '__all__'

class CommentSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    user_avatar = serializers.SerializerMethodField()
    user_equipped_frame = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ('id', 'user', 'username', 'user_avatar', 'user_equipped_frame', 'text', 'created_at')

    def get_user_avatar(self, obj):
        if obj.user.profile.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.profile.avatar.url)
            return obj.user.profile.avatar.url
        return None

    def get_user_equipped_frame(self, obj):
        inventory = UserInventory.objects.filter(user=obj.user, item__item_type='FRAME', is_equipped=True).first()
        if inventory and inventory.item.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(inventory.item.image.url)
            return inventory.item.image.url
        return None

class QuizRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizRating
        fields = ('id', 'user', 'quiz', 'rating')


class GameRoomSerializer(serializers.ModelSerializer):
    quiz_title = serializers.ReadOnlyField(source='quiz.title')
    host_username = serializers.ReadOnlyField(source='host.username')
    questions_count = serializers.SerializerMethodField()

    class Meta:
        model = GameRoom
        fields = ('id', 'pin', 'quiz', 'quiz_title', 'host_username', 'is_active', 'created_at', 'questions_count')
        read_only_fields = ('pin', 'host', 'created_at')

    def get_questions_count(self, obj):
        return obj.quiz.questions.count()
