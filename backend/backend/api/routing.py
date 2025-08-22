# api/routing.py

from django.urls import path, re_path
from .consumers import ChatConsumer

websocket_urlpatterns = [
    # This URL is for WebSocket connections, e.g., ws://.../ws/chat/1/
    re_path(r'ws/chat/(?P<thread_id>\d+)/$', ChatConsumer.as_asgi()),
]