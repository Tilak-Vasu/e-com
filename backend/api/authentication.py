from rest_framework import authentication
from rest_framework import exceptions
from clerk import ClerkJWT  
from django.conf import settings

class ClerkAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', None)
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        try:
            # Verify the token with Clerk's SDK
            decoded_token = ClerkJWT(jwt_string=token, secret_key=settings.CLERK_SECRET_KEY).verify()
            
            # Here, we create a "dummy" user object. Django needs a user object,
            # but we don't need to save it to our database.
            class DummyUser:
                is_authenticated = True
                
            user = DummyUser()
            user.id = decoded_token.get('sub') # The user's Clerk ID
            user.clerk_claims = decoded_token # Attach all claims for later use

            return (user, None) # Success
            
        except Exception as e:
            raise exceptions.AuthenticationFailed(f"Clerk authentication failed: {e}")