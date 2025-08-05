# backend/api/urls.py

from django.urls import path
from .views import CreateUserView, MyTokenObtainPairView # Import your new view
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', CreateUserView.as_view(), name='register'),
    # --- UPDATE THIS LINE ---
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]