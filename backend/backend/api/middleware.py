# api/middleware.py

from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user(token_key):
    try:
        # Decode the token and get the user ID
        token = AccessToken(token_key)
        user_id = token.payload.get('user_id')
        return User.objects.get(pk=user_id)
    except Exception:
        # If token is invalid or expired, return an anonymous user
        return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Get the token from the query string
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]

        if token:
            # If a token is present, try to authenticate the user
            scope['user'] = await get_user(token)
        else:
            # Otherwise, the user is anonymous
            scope['user'] = AnonymousUser()
        
        # Continue processing the request
        return await super().__call__(scope, receive, send)