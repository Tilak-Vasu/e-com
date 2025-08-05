# backend/api/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .authentication import ClerkAuthentication # <-- IMPORT IT

class ProtectedDataView(APIView):
    # This view requires a valid Clerk token to be accessed
    authentication_classes = [ClerkAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # You can access the user's Clerk ID like this:
        clerk_user_id = request.user.id
        print(f"Authenticated request from Clerk user: {clerk_user_id}")
        
        return Response({"message": "This is protected data!"})