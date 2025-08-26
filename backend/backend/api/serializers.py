# api/serializers.py

from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    Product, LikedProduct, Order, OrderItem,
    ChatMessage, ChatThread, ProductReview
)


# ==========================================================
# --- USER & AUTH SERIALIZERS ---
# ==========================================================
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "password", "email")
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # --- THIS IS THE FIX ---
        # Add all required custom claims for the frontend
        token['id'] = user.id
        token['username'] = user.username
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser # <-- ADDED

        return token


# ==========================================================
# --- PRODUCT & REVIEW SERIALIZERS ---
# ==========================================================
class AuthorSerializer(serializers.ModelSerializer):
    """A simple serializer for displaying author info in reviews."""
    class Meta:
        model = User
        fields = ['id', 'username']

class ProductReviewSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)
    class Meta:
        model = ProductReview
        fields = ['id', 'author', 'text', 'created_at', 'updated_at']
        read_only_fields = ['author']

class ProductWriteSerializer(serializers.ModelSerializer):
    """Serializer for CREATING and UPDATING products (handles file uploads)."""
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Product
        fields = [
            "name", "category", "price",
            "description", "stock_quantity", "image"
        ]

class ProductReadSerializer(serializers.ModelSerializer):
    """Serializer for READING product data (displaying products)."""
    is_liked = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    reviews = ProductReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "category", "price",
            "description", "stock_quantity", "is_liked", "image", "reviews"
        ]

    def get_is_liked(self, obj):
        request = self.context.get('request')
        user = request.user if request and hasattr(request, "user") else None
        if user and user.is_authenticated:
            return LikedProduct.objects.filter(user=user, product=obj).exists()
        return False

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            return request.build_absolute_uri(obj.image.url)
        return None

    def get_description(self, obj):
        if obj.description and obj.description.strip():
            return obj.description
        return "Here is the product"


class ProductDetailSerializer(serializers.ModelSerializer):
    """A minimal serializer for product details inside an order."""
    class Meta:
        model = Product
        fields = ("id", "name", "price")


# ==========================================================
# --- ORDER SERIALIZERS ---
# ==========================================================
class OrderItemDetailSerializer(serializers.ModelSerializer):
    product = ProductDetailSerializer(read_only=True)
    class Meta:
        model = OrderItem
        fields = ("quantity", "price", "product")

class OrderHistorySerializer(serializers.ModelSerializer):
    items = OrderItemDetailSerializer(many=True, read_only=True)
    user = serializers.StringRelatedField()
    class Meta:
        model = Order
        fields = (
            "id", "user", "created_at", "total_amount",
            "shipping_info", "payment_method", "items"
        )

class OrderItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ("product", "quantity")

class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True, write_only=True)
    class Meta:
        model = Order
        fields = ("id", "shipping_info", "payment_method", "items")
        read_only_fields = ("id",)

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        total_amount = 0
        order_items_to_create = []

        for item_data in items_data:
            product, quantity = item_data['product'], item_data['quantity']
            price = product.price
            total_amount += price * quantity
            order_items_to_create.append(OrderItem(product=product, quantity=quantity, price=price))

        order = Order.objects.create(user=user, total_amount=total_amount, **validated_data)
        for item in order_items_to_create:
            item.order = order
        OrderItem.objects.bulk_create(order_items_to_create)
        return order


# ==========================================================
# --- CHAT SERIALIZERS ---
# ==========================================================
class ChatMessageSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='sender.username', read_only=True)
    is_staff = serializers.BooleanField(source='sender.is_staff', read_only=True)
    message = serializers.CharField(source='text', read_only=True)
    class Meta:
        model = ChatMessage
        fields = ['id', 'timestamp', 'username', 'is_staff', 'message']

class ChatThreadSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    participants_usernames = serializers.SerializerMethodField()
    class Meta:
        model = ChatThread
        fields = [
            'id', 'participants', 'participants_usernames',
            'messages', 'created_at', 'updated_at'
        ]
        read_only_fields = ['participants']

    def get_participants_usernames(self, obj):
        return [user.username for user in obj.participants.all()]