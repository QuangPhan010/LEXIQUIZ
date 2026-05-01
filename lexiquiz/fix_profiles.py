import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lexiquiz.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Profile

def ensure_profiles():
    users = User.objects.all()
    count = 0
    for user in users:
        profile, created = Profile.objects.get_or_create(user=user)
        if created:
            count += 1
            print(f"Created profile for user: {user.username}")
    print(f"Done! Created {count} missing profiles.")

if __name__ == "__main__":
    ensure_profiles()
