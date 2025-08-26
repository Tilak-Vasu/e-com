# api/views.py

# --- Python & Django Imports ---
import calendar
import datetime
from django.utils import timezone
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncMonth, TruncDay
from django.contrib.auth.models import User
from django.conf import settings

# --- Third-Party Imports ---
import stripe
from rest_framework import generics, permissions, status, viewsets, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser,JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView

# --- Local Application Imports ---
from .models import (
    Product, LikedProduct, Order, OrderItem, ChatThread, ProductReview
)
from .serializers import (
    UserSerializer,
    ProductReadSerializer, # Use the correct read/write serializers
    ProductWriteSerializer,
    OrderHistorySerializer,
    OrderCreateSerializer,
    ChatThreadSerializer,
    MyTokenObtainPairSerializer,
    ProductReviewSerializer
)
from .permissions import IsAuthorOrAdminOrReadOnly

# ==========================================================
# --- CONFIGURATIONS ---
# ==========================================================
stripe.api_key = settings.STRIPE_SECRET_KEY

# ==========================================================
# --- PAYMENT VIEW ---
# ==========================================================
class CreatePaymentIntentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        total_amount = request.data.get('total_amount')
        if not total_amount:
            return Response({'error': 'Total amount is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            amount_in_cents = int(float(total_amount) * 100)
            intent = stripe.PaymentIntent.create(
                amount=amount_in_cents,
                currency='usd',
                metadata={'user_id': request.user.id, 'username': request.user.username}
            )
            return Response({'clientSecret': intent.client_secret})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# ==========================================================
# --- AUTHENTICATION VIEWS ---
# ==========================================================
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# ==========================================================
# --- PRODUCT, CATEGORY, REVIEW, & LIKE VIEWS ---
# ==========================================================
# Add this to your views.py - Updated ProductViewSet with debugging
import logging

from rest_framework import status

logger = logging.getLogger(__name__)


class ProductViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD for products, including listing and creating product reviews.
    """
    queryset = Product.objects.all().order_by('id')
    
    # --- FIX #1: Add JSONParser to accept JSON data for reviews ---
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_serializer_class(self):
        """
        Dynamically chooses the serializer based on the action.
        ProductWriteSerializer for create/update, ProductReadSerializer for others.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return ProductWriteSerializer
        return ProductReadSerializer

    def get_serializer_context(self):
        """Pass the request context to the serializer."""
        return {'request': self.request}

    def get_permissions(self):
        """
        Define permissions based on the action.
        - Allow anyone to list/retrieve products and reviews.
        - Require authentication to post a review.
        - Require admin privileges for all other actions (create/update/delete product).
        """
        if self.action in ['list', 'retrieve'] or (self.action == 'reviews' and self.request.method == 'GET'):
            return [permissions.AllowAny()]
        if self.action == 'reviews' and self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    def create(self, request, *args, **kwargs):
        """Override create to add debugging for product creation."""
        logger.info("=== CREATE PRODUCT DEBUG ===")
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"Request.data: {request.data}")
        logger.info(f"Request.FILES: {request.FILES}")
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            logger.info("Serializer is valid for product creation.")
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        else:
            logger.error(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        """Override update to add debugging for product updates."""
        logger.info("=== UPDATE PRODUCT DEBUG ===")
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"Product ID: {kwargs.get('pk')}")
        logger.info(f"Request.data: {request.data}")
        logger.info(f"Request.FILES: {request.FILES}")

        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            logger.info("Serializer is valid for product update.")
            self.perform_update(serializer)
            return Response(serializer.data)
        else:
            logger.error(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'post'], url_path='reviews')
    def reviews(self, request, pk=None):
        """
        Handles listing (GET) and creating (POST) reviews for a specific product.
        """
        product = self.get_object()

        if request.method == 'GET':
            reviews = product.reviews.all()
            serializer = ProductReviewSerializer(reviews, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = ProductReviewSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                # --- FIX #2: The check for existing reviews has been removed ---
                # This allows a user to post multiple reviews for the same product.
                serializer.save(author=request.user, product=product)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            # If the serializer is not valid, return the errors.
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ProductReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductReview.objects.all()
    serializer_class = ProductReviewSerializer
    permission_classes = [IsAuthorOrAdminOrReadOnly]

class CategoryListView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request, *args, **kwargs):
        categories = Product.objects.values_list('category', flat=True).distinct().order_by('category')
        return Response(categories)

class LikedProductView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, *args, **kwargs):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"error": "Product ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        product = generics.get_object_or_404(Product, id=product_id)
        liked_product, created = LikedProduct.objects.get_or_create(user=request.user, product=product)
        if created:
            return Response({"status": "liked"}, status=status.HTTP_201_CREATED)
        else:
            liked_product.delete()
            return Response({"status": "unliked"}, status=status.HTTP_200_OK)

class LikedProductListView(generics.ListAPIView):
    serializer_class = ProductReadSerializer # Use the read serializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        liked_product_ids = LikedProduct.objects.filter(user=user).values_list('product_id', flat=True)
        return Product.objects.filter(id__in=liked_product_ids)

# ==========================================================
# --- ORDER VIEWS ---
# ==========================================================
class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderHistorySerializer
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')
    def get_serializer_context(self):
        return {'request': self.request}

# ==========================================================
# --- ADMIN DASHBOARD VIEW ---
# ==========================================================
class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAdminUser]
    def get(self, request, *args, **kwargs):
        now = timezone.now()
        all_orders = Order.objects.all()
        total_income = all_orders.aggregate(total=Sum('total_amount'))['total'] or 0
        total_orders_count = all_orders.count()
        total_users_count = User.objects.count()

        monthly_labels, monthly_sales_data, monthly_orders_data = [], [], []
        for i in range(11, -1, -1):
            dt = now - datetime.timedelta(days=i * 30)
            month_start, last_day = dt.replace(day=1), calendar.monthrange(dt.year, dt.month)[1]
            month_end = month_start.replace(day=last_day)
            monthly_labels.append(month_start.strftime('%b'))
            monthly_sales = Order.objects.filter(created_at__range=(month_start, month_end)).aggregate(total=Sum('total_amount'))['total'] or 0
            monthly_orders = Order.objects.filter(created_at__range=(month_start, month_end)).count()
            monthly_sales_data.append(float(monthly_sales))
            monthly_orders_data.append(monthly_orders)

        first_day_of_month, last_day_num = now.date().replace(day=1), calendar.monthrange(now.year, now.month)[1]
        days_in_month_labels = [str(d).zfill(2) for d in range(1, last_day_num + 1)]
        daily_data_map = {label: {'sales': 0, 'orders': 0} for label in days_in_month_labels}
        daily_query = Order.objects.filter(created_at__date__gte=first_day_of_month).annotate(day=TruncDay('created_at')).values('day').annotate(daily_sales=Sum('total_amount'), daily_orders=Count('id')).order_by('day')
        for item in daily_query:
            day_str = item['day'].strftime('%d')
            if day_str in daily_data_map:
                daily_data_map[day_str]['sales'], daily_data_map[day_str]['orders'] = float(item['daily_sales']), item['daily_orders']

        category_sales_query = OrderItem.objects.values('product__category').annotate(total_revenue=Sum(F('quantity') * F('price'))).order_by('-total_revenue')
        recent_transactions = Order.objects.order_by('-created_at')[:5]
        
        data = {
            'kpis': { 'total_income': f"{total_income:,.2f}", 'total_orders': total_orders_count, 'total_users': total_users_count },
            'main_chart': {
                'monthly': { 'labels': monthly_labels, 'sales_data': monthly_sales_data, 'orders_data': monthly_orders_data },
                'daily': { 'labels': list(daily_data_map.keys()), 'sales_data': [v['sales'] for v in daily_data_map.values()], 'orders_data': [v['orders'] for v in daily_data_map.values()] }
            },
            'category_sales_chart': { 'labels': [item['product__category'] or 'Uncategorized' for item in category_sales_query], 'data': [float(item['total_revenue']) for item in category_sales_query] },
            'recent_transactions': OrderHistorySerializer(recent_transactions, many=True).data,
        }
        return Response(data)

# ==========================================================
# --- CHAT VIEWS ---
# ==========================================================
class ChatThreadView(generics.ListCreateAPIView):
    serializer_class = ChatThreadSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            customer_threads, seen_customers = {}, set()
            all_customer_threads = ChatThread.objects.filter(participants__is_staff=False).distinct().order_by('-updated_at')
            for thread in all_customer_threads:
                customer = thread.participants.filter(is_staff=False).first()
                if customer and customer.id not in seen_customers:
                    customer_threads[customer.id] = thread
                    seen_customers.add(customer.id)
            return list(customer_threads.values())
        else:
            return ChatThread.objects.filter(participants=user)
    def create(self, request, *args, **kwargs):
        user = request.user
        if user.is_staff:
            return Response({"error": "Staff cannot create threads this way."}, status=status.HTTP_403_FORBIDDEN)
        existing_thread = ChatThread.objects.filter(participants=user).first()
        if existing_thread:
            serializer = self.get_serializer(existing_thread)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)
    def perform_create(self, serializer):
        customer = self.request.user
        staff_users = User.objects.filter(is_staff=True, is_active=True)
        participants = [customer] + list(staff_users)
        serializer.save(participants=participants)