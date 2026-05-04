from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/duel/(?P<room_name>\w+)/$', consumers.DuelConsumer.as_asgi()),
    re_path(r'ws/game/(?P<pin>[0-9]{6})/$', consumers.KahootConsumer.as_asgi()),
]
