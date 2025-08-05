# backend/api/views.py

from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer, MyTokenObtainPairSerializer # Import it
from rest_framework_simplejwt.views import TokenObtainPairView

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = []

# --- ADD THIS NEW VIEW ---
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer