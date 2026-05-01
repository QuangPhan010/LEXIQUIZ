from django.contrib import admin
from .models import (
    Quiz, Question, Choice, Result, Category, Profile, 
    DailyQuest, UserQuest, Item, UserInventory, SkillXP,
    QuizRating, Comment, Follow
)

class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 4

class QuestionAdmin(admin.ModelAdmin):
    inlines = [ChoiceInline]

class QuestionInline(admin.StackedInline):
    model = Question
    extra = 1

class QuizAdmin(admin.ModelAdmin):
    inlines = [QuestionInline]
    list_display = ('title', 'creator', 'created_at')

admin.site.register(Quiz, QuizAdmin)
admin.site.register(Question, QuestionAdmin)
admin.site.register(Choice)
admin.site.register(Result)
admin.site.register(Category)
admin.site.register(Profile)
admin.site.register(DailyQuest)
admin.site.register(UserQuest)
admin.site.register(Item)
admin.site.register(UserInventory)
admin.site.register(SkillXP)
admin.site.register(QuizRating)
admin.site.register(Comment)
admin.site.register(Follow)
