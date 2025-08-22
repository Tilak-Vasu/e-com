# from django.contrib.auth.models import User
# from rest_framework import serializers
# from .models import Product, LikedProduct, Order, OrderItem
# from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# # --- AUTHENTICATION SERIALIZERS (No changes) ---
# class UserSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = ("id", "username", "password", "email")
#         extra_kwargs = {"password": {"write_only": True}}

#     def create(self, validated_data):
#         user = User.objects.create_user(**validated_data)
#         return user

# class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
#     @classmethod
#     def get_token(cls, user):
#         token = super().get_token(user)
#         # Add custom claims
#         token['username'] = user.username
#         return token

# # --- PRODUCT SERIALIZER (No changes) ---
# class ProductSerializer(serializers.ModelSerializer):
#     is_liked = serializers.SerializerMethodField()

#     class Meta:
#         model = Product
#         fields = ["id", "name", "category", "price", "description", "is_liked"]

#     def get_is_liked(self, obj):
#         user = self.context.get('request').user
#         if user.is_authenticated:
#             return LikedProduct.objects.filter(user=user, product=obj).exists()
#         return False

# # --- ORDER SERIALIZERS (REFACTORED) ---

# # --- Serializers for READING Order History ---

# class ProductDetailSerializer(serializers.ModelSerializer):
#     """Read-only serializer for displaying product details inside an order."""
#     class Meta:
#         model = Product
#         fields = ("id", "name", "price")

# class OrderItemDetailSerializer(serializers.ModelSerializer):
#     """Read-only serializer for displaying items within the order history."""
#     product = ProductDetailSerializer(read_only=True)

#     class Meta:
#         model = OrderItem
#         fields = ("quantity", "price", "product")

# class OrderHistorySerializer(serializers.ModelSerializer):
#     """
#     Read-only serializer for the order history list (GET requests).
#     Provides full nested details for items.
#     """
#     items = OrderItemDetailSerializer(many=True, read_only=True)
#     # Display username instead of user ID for clarity
#     user = serializers.StringRelatedField()
#     shipping_info = serializers.JSONField() 


#     class Meta:
#         model = Order
#         fields = ("id", "user", "created_at", "total_amount", "shipping_info", "payment_method", "items")


# # --- Serializers for CREATING a New Order ---

# class OrderItemCreateSerializer(serializers.ModelSerializer):
#     """Write-only serializer for providing item data when creating an order."""
#     class Meta:
#         model = OrderItem
#         # Client only needs to send product ID and quantity
#         fields = ("product", "quantity")

# class OrderCreateSerializer(serializers.ModelSerializer):
#     """
#     Write-only serializer for creating a new order (POST requests).
#     Validates input and calculates total amount on the backend.
#     """
#     items = OrderItemCreateSerializer(many=True, write_only=True)

#     class Meta:
#         model = Order
#         # Client sends shipping/payment info. User and total are handled on the backend.
#         fields = ("id", "shipping_info", "payment_method", "items")
#         read_only_fields = ("id",)

#     def create(self, validated_data):
#         items_data = validated_data.pop('items')
        
#         # --- BEST PRACTICE: Calculate total on the backend ---
#         # This prevents users from manipulating the total price from the client-side.
#         total_amount = 0
#         order_items_to_create = []
#         for item_data in items_data:
#             product = item_data['product']
#             quantity = item_data['quantity']
#             # Fetch the current price from the database to ensure it's correct
#             price = product.price 
#             total_amount += price * quantity
#             order_items_to_create.append(
#                 OrderItem(product=product, quantity=quantity, price=price)
#             )

#         # Set the calculated total on the order
#         validated_data['total_amount'] = total_amount
#         order = Order.objects.create(**validated_data)
        
#         # Link the OrderItem instances to the new order and create them
#         for item in order_items_to_create:
#             item.order = order
        
#         OrderItem.objects.bulk_create(order_items_to_create)
        
#         return order




# api/serializers.py

from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Product, LikedProduct, Order, OrderItem
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

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
        # --- ADD CUSTOM CLAIMS FOR ADMIN ROLES ---
        token['username'] = user.username
        token['is_staff'] = user.is_staff

        return token

class ProductSerializer(serializers.ModelSerializer):
    is_liked = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        # --- UPDATE THIS LINE ---
        fields = ["id", "name", "category", "price", "description", "stock_quantity", "is_liked", "image"]

    def get_is_liked(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return LikedProduct.objects.filter(user=user, product=obj).exists()
        return False
    
    def get_image(self, obj):
        request = self.context.get('request')
        # If the product has an image, build its absolute URI
        if obj.image and hasattr(obj.image, 'url'):
            return request.build_absolute_uri(obj.image.url)
        # If not, return None (the frontend will handle the placeholder)
        return None

class ProductDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ("id", "name", "price")

class OrderItemDetailSerializer(serializers.ModelSerializer):
    product = ProductDetailSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ("quantity", "price", "product")

class OrderHistorySerializer(serializers.ModelSerializer):
    items = OrderItemDetailSerializer(many=True, read_only=True)
    user = serializers.StringRelatedField()
    shipping_info = serializers.JSONField() 

    class Meta:
        model = Order
        fields = ("id", "user", "created_at", "total_amount", "shipping_info", "payment_method", "items")

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
        
        total_amount = 0
        order_items_to_create = []
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            price = product.price 
            total_amount += price * quantity
            order_items_to_create.append(
                OrderItem(product=product, quantity=quantity, price=price)
            )

        validated_data['total_amount'] = total_amount
        order = Order.objects.create(**validated_data)
        
        for item in order_items_to_create:
            item.order = order
        
        OrderItem.objects.bulk_create(order_items_to_create)
        
        return order


from rest_framework import serializers
from .models import ChatMessage, ChatThread

class ChatMessageSerializer(serializers.ModelSerializer):
    """
    Serializes a single chat message, adding sender information in the
    exact format the frontend components expect.
    """
    # Source the username from the related sender object
    username = serializers.CharField(source='sender.username', read_only=True)
    
    # Source the staff status from the related sender object
    is_staff = serializers.BooleanField(source='sender.is_staff', read_only=True)
    
    # RENAME the 'text' field to 'message' to match the WebSocket consumer
    message = serializers.CharField(source='text', read_only=True)

    class Meta:
        model = ChatMessage
        # Provide the fields in the exact structure the frontend needs
        fields = ['id', 'timestamp', 'username', 'is_staff', 'message']


class ChatThreadSerializer(serializers.ModelSerializer):
    """
    Serializes a chat thread, including all of its messages using the
    corrected ChatMessageSerializer above.
    """
    messages = ChatMessageSerializer(many=True, read_only=True)
    participants_usernames = serializers.SerializerMethodField()

    class Meta:
        model = ChatThread
        fields = ['id', 'participants', 'participants_usernames', 'messages', 'created_at', 'updated_at']
        read_only_fields = ['participants']

    def get_participants_usernames(self, obj):
        return [user.username for user in obj.participants.all()]