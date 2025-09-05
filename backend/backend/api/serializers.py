# api/serializers.py

from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    CartItem, Product, LikedProduct, Order, OrderItem,
    ChatMessage, ChatThread, ProductReview, UserCart
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
    """Serializer for CREATING and UPDATING products (handles both URL and file uploads)."""
    image_url = serializers.URLField(required=False, allow_null=True, allow_blank=True)
    image_file = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Product
        fields = [
            "name", "category", "price", "description", "stock_quantity", 
            "image_url", "image_file", "seo_keywords"
        ]
    
    def validate(self, data):
        """Ensure at least one image method is used, but not both"""
        image_url = data.get('image_url')
        image_file = data.get('image_file')
        
        # Both provided - clear the URL to prioritize file upload
        if image_url and image_file:
            data['image_url'] = None
            
        return data

class ProductReadSerializer(serializers.ModelSerializer):
    """Serializer for READING product data (displaying products)."""
    is_liked = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()  # Virtual field that returns the appropriate image
    description = serializers.SerializerMethodField()
    reviews = ProductReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "category", "price", "description", "stock_quantity",
            "seo_keywords", "is_liked", "image", "reviews"
        ]

    def get_is_liked(self, obj):
        request = self.context.get('request')
        user = request.user if request and hasattr(request, "user") else None
        if user and user.is_authenticated:
            return LikedProduct.objects.filter(user=user, product=obj).exists()
        return False

    def get_image(self, obj):
        """Returns the appropriate image URL - prioritizes uploaded file over URL"""
        request = self.context.get('request')
        if obj.image_file:
            return request.build_absolute_uri(obj.image_file.url) if request else obj.image_file.url
        return obj.image_url

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


from django.db import transaction

class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True, write_only=True)
    
    class Meta:
        model = Order
        fields = ("id", "shipping_info", "payment_method", "items")
        read_only_fields = ("id",)

    # --- THIS IS THE NEW VALIDATION LOGIC ---
    def validate(self, data):
        """
        Check that the requested quantity for each item is available in stock.
        """
        items_data = data.get('items', [])
        
        for item_data in items_data:
            product = item_data['product']
            quantity_requested = item_data['quantity']
            
            if quantity_requested <= 0:
                raise serializers.ValidationError({
                    "items": f"Quantity for '{product.name}' must be a positive number."
                })
                
            if quantity_requested > product.stock_quantity:
                raise serializers.ValidationError({
                    "items": f"Not enough stock for '{product.name}'. Only {product.stock_quantity} units available, but you requested {quantity_requested}."
                })

        return data
    
    # --- THIS create METHOD IS UPDATED TO BE ATOMIC AND DEDUCT STOCK ---
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        
        # All database operations are now wrapped in a transaction.
        # If any step fails (e.g., stock runs out), the entire operation is rolled back.
        with transaction.atomic():
            order = Order.objects.create(user=user, total_amount=0, **validated_data)
            total_amount = 0
            
            for item_data in items_data:
                product = item_data['product']
                quantity = item_data['quantity']
                
                # Re-check stock to prevent race conditions
                product.refresh_from_db()
                if quantity > product.stock_quantity:
                    raise serializers.ValidationError(f"Someone just bought the last '{product.name}'. Please adjust your cart.")

                # Create the OrderItem
                OrderItem.objects.create(order=order, product=product, quantity=quantity, price=product.price)

                # --- Crucially, decrease the product's stock quantity ---
                product.stock_quantity -= quantity
                product.save(update_fields=['stock_quantity'])

                total_amount += product.price * quantity

            # Update the order's final total amount
            order.total_amount = total_amount
            order.save(update_fields=['total_amount'])

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
    

class CartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(write_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = CartItem
        fields = [
            'id', 'product_id', 'product_name', 'quantity', 
            'price_at_addition', 'stock_at_update'
        ]
        read_only_fields = ['id', 'product_name', 'price_at_addition', 'stock_at_update']

class UserCartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True)

    class Meta:
        model = UserCart
        fields = ['items', 'updated_at']
        read_only_fields = ['updated_at']



from .models import PolicyDocument

class PolicyDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PolicyDocument
        fields = ['id', 'title', 'file', 'uploaded_at', 'updated_at']
        read_only_fields = ['id', 'uploaded_at', 'updated_at']