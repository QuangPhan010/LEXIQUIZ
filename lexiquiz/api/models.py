from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
import random
import string

class Category(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, default='HelpCircle') # Lucide icon name

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    last_active = models.DateField(default=timezone.now)
    streak_count = models.IntegerField(default=0)
    max_streak = models.IntegerField(default=0)
    coins = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} - Level {self.level} - Coins: {self.coins}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()

class Quiz(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quizzes')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='quizzes')
    is_public = models.BooleanField(default=True)
    time_limit = models.PositiveIntegerField(default=0) # In seconds, 0 means no limit
    tags = models.CharField(max_length=255, blank=True) # Comma separated tags

    def __str__(self):
        return self.title

    class Meta:
        verbose_name_plural = "Quizzes"

class Question(models.Model):
    QUESTION_TYPES = (
        ('MCQ', 'Multiple Choice'),
        ('TF', 'True/False'),
        ('ORDER', 'Ordering'),
        ('MATCH', 'Matching'),
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    order = models.PositiveIntegerField(default=0)
    question_type = models.CharField(max_length=10, choices=QUESTION_TYPES, default='MCQ')
    time_limit_seconds = models.PositiveIntegerField(default=10)  # Per-question countdown
    image = models.ImageField(upload_to='question_images/', null=True, blank=True)
    video_url = models.CharField(max_length=512, blank=True)  # YouTube or direct video URL

    def __str__(self):
        return f"{self.quiz.title} - {self.text[:50]}"

    class Meta:
        ordering = ['order']

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=255)
    match_text = models.CharField(max_length=255, blank=True, null=True) # For Matching questions
    is_correct = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0) # For Ordering questions

    def __str__(self):
        return self.text

class Result(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='results')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    score = models.IntegerField()
    total_questions = models.IntegerField()
    duration = models.IntegerField(default=0) # Seconds taken
    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.quiz.title} - {self.score}/{self.total_questions}"

class UserAnswer(models.Model):
    result = models.ForeignKey(Result, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(Choice, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"{self.result.user.username} - {self.question.text[:20]}"

class DailyQuest(models.Model):
    QUEST_TYPES = (
        ('QUIZ_COUNT', 'Complete Quizzes'),
        ('SCORE_AVG', 'Average Score'),
        ('XP_GAIN', 'Earn XP'),
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    quest_type = models.CharField(max_length=20, choices=QUEST_TYPES)
    requirement_value = models.IntegerField()
    reward_coins = models.IntegerField(default=50)
    reward_xp = models.IntegerField(default=100)
    category = models.CharField(max_length=50, default='General')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title

class UserQuest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quests')
    quest = models.ForeignKey(DailyQuest, on_delete=models.CASCADE)
    progress = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    is_claimed = models.BooleanField(default=False)
    date = models.DateField(default=timezone.now)

    def __str__(self):
        return f"{self.user.username} - {self.quest.title} - {self.is_completed}"

class Item(models.Model):
    ITEM_TYPES = (
        ('FRAME', 'Avatar Frame'),
        ('THEME', 'UI Theme'),
        ('BADGE', 'Special Badge'),
    )
    name = models.CharField(max_length=100)
    description = models.TextField()
    price = models.IntegerField()
    item_type = models.CharField(max_length=20, choices=ITEM_TYPES)
    image = models.ImageField(upload_to='items/', null=True, blank=True)
    config = models.JSONField(null=True, blank=True) # For themes or special effects

    def __str__(self):
        return self.name

class UserInventory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inventory')
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    is_equipped = models.BooleanField(default=False)
    purchased_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.item.name}"

    class Meta:
        verbose_name_plural = "User Inventories"

class SkillXP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skill_xp')
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)

    class Meta:
        unique_together = ('user', 'category')
        verbose_name_plural = "Skill XP"

    def __str__(self):
        return f"{self.user.username} - {self.category.name} - Level {self.level}"

class QuizRating(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='ratings')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'quiz')

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} on {self.quiz.title}"

class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')


def generate_room_pin():
    """Generate a unique 6-digit numeric PIN for a game room."""
    while True:
        pin = ''.join(random.choices(string.digits, k=6))
        if not GameRoom.objects.filter(pin=pin, is_active=True).exists():
            return pin


class GameRoom(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='game_rooms')
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hosted_rooms')
    pin = models.CharField(max_length=6, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Room {self.pin} - {self.quiz.title} (Host: {self.host.username})"

    def save(self, *args, **kwargs):
        if not self.pin:
            self.pin = generate_room_pin()
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Game Room"
        verbose_name_plural = "Game Rooms"
