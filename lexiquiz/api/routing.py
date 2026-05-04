from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/duel/<str:room_name>/', consumers.DuelConsumer.as_asgi()),
    path('ws/game/<str:pin>/', consumers.KahootConsumer.as_asgi()),
]
