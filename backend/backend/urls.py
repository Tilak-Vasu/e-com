# backend/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # All URLs from api/urls.py will be prefixed with 'api/auth/'
    path('api/auth/', include('api.urls')),
]