# api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CreateUserView, MyTokenObtainPairView, ProductViewSet,
    ProductReviewDetailView, CategoryListView, LikedProductView,
    LikedProductListView, OrderListCreateView, AdminDashboardView,
    ChatThreadView, CreatePaymentIntentView
)
from .views import CartView ,ChatbotView# Import the new view
from .views import PolicyDocumentViewSet
router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'documents', PolicyDocumentViewSet, basename='document')

urlpatterns = [
    # --- AUTHENTICATION ---
    path('register/', CreateUserView.as_view(), name='register'),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # --- CATEGORIES & LIKES ---
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('products/like/', LikedProductView.as_view(), name='product-like-toggle'),
    path('products/liked/', LikedProductListView.as_view(), name='liked-product-list'),
    # --- REVIEWS (DETAIL VIEW ONLY) ---
    path('reviews/<int:pk>/', ProductReviewDetailView.as_view(), name='product-review-detail'),
    # --- ORDERS & CHECKOUT ---
    path('orders/', OrderListCreateView.as_view(), name='order-list-create'),
    path('create-payment-intent/', CreatePaymentIntentView.as_view(), name='create-payment-intent'),
    # --- CHAT ---
    path('chat_threads/', ChatThreadView.as_view(), name='chat-thread-list'),
    # --- ADMIN ---
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),

    path('cart/', CartView.as_view(), name='user-cart'), # <-- ADD THIS LINE
    path('chatbot/', ChatbotView.as_view(), name='chatbot'), # <-- ADD THIS LINE


    # --- ROUTER URLS ---
    path('', include(router.urls)),
]