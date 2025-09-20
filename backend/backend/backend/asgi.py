#backend/backend/backend/asgi.py
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django_asgi_app = get_asgi_application()

# Import your new middleware
from channels.routing import ProtocolTypeRouter, URLRouter
from api.middleware import TokenAuthMiddleware # <<< IMPORT THIS
import api.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": TokenAuthMiddleware( # <<< USE YOUR MIDDLEWARE HERE
        URLRouter(
            api.routing.websocket_urlpatterns
        )
    ),
})
