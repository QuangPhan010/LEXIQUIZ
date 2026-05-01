import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lexiquiz.settings')
django.setup()

from api.models import DailyQuest

def seed_quests():
    quests = [
        # --- Starter Group ---
        {
            "title": "Novice Learner",
            "description": "Complete 3 quizzes today to sharpen your mind!",
            "quest_type": "QUIZ_COUNT",
            "requirement_value": 3,
            "reward_coins": 50,
            "reward_xp": 100,
            "category": "Starter"
        },
        {
            "title": "Warm Up",
            "description": "Complete your first quiz of the day.",
            "quest_type": "QUIZ_COUNT",
            "requirement_value": 1,
            "reward_coins": 20,
            "reward_xp": 50,
            "category": "Starter"
        },
        
        # --- Expert Group ---
        {
            "title": "Perfect Score",
            "description": "Get a perfect 100% on any quiz.",
            "quest_type": "SCORE_AVG",
            "requirement_value": 100,
            "reward_coins": 150,
            "reward_xp": 250,
            "category": "Expert"
        },
        {
            "title": "Accuracy Pro",
            "description": "Get at least 80% correct on a quiz.",
            "quest_type": "SCORE_AVG",
            "requirement_value": 80,
            "reward_coins": 60,
            "reward_xp": 120,
            "category": "Expert"
        },

        # --- Farmer Group ---
        {
            "title": "XP Farmer",
            "description": "Earn 300 XP by answering questions correctly.",
            "quest_type": "XP_GAIN",
            "requirement_value": 300,
            "reward_coins": 100,
            "reward_xp": 200,
            "category": "Farmer"
        },
        {
            "title": "XP Master",
            "description": "Earn a massive 500 XP today.",
            "quest_type": "XP_GAIN",
            "requirement_value": 500,
            "reward_coins": 200,
            "reward_xp": 400,
            "category": "Farmer"
        },
        
        # --- Collector Group ---
        {
            "title": "Knowledge Seeker",
            "description": "Complete 5 quizzes today.",
            "quest_type": "QUIZ_COUNT",
            "requirement_value": 5,
            "reward_coins": 80,
            "reward_xp": 150,
            "category": "Collector"
        }
    ]

    for q_data in quests:
        quest, created = DailyQuest.objects.update_or_create(
            title=q_data['title'],
            defaults=q_data
        )
        if created:
            print(f"Created quest: {quest.title} in {quest.category}")
        else:
            print(f"Updated quest: {quest.title} in {quest.category}")

if __name__ == "__main__":
    print("Seeding Daily Quests with categories...")
    seed_quests()
    print("Done!")
