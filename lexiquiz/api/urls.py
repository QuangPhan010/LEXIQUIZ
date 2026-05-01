from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuizViewSet, ResultViewSet, AuthViewSet, CategoryViewSet, LeaderboardViewSet
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'results', ResultViewSet, basename='result')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'leaderboard', LeaderboardViewSet, basename='leaderboard')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', AuthViewSet.as_view({'post': 'register'}), name='register'),
    path('auth/me/', AuthViewSet.as_view({'get': 'me'}), name='me'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('history/', ResultViewSet.as_view({'get': 'list'}), name='history'),
    path('submit/', ResultViewSet.as_view({'post': 'submit'}), name='submit'),
]
