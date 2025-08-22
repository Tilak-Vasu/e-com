# api/views.py

import calendar
import datetime
from django.utils import timezone
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth, TruncDay
from django.contrib.auth.models import User
from rest_framework import generics, permissions, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
import stripe
from .models import Product, LikedProduct, Order, OrderItem, ChatThread
from .serializers import (
    UserSerializer,
    ProductSerializer,
    OrderHistorySerializer,
    OrderCreateSerializer,
    ChatThreadSerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from .models import Product

from django.conf import settings

from rest_framework.permissions import IsAuthenticated

stripe.api_key = settings.STRIPE_SECRET_KEY

class CreatePaymentIntentView(APIView):
    """
    An endpoint to create a Stripe Payment Intent.
    This must be called before confirming the payment on the frontend.
    """
    permission_classes = [IsAuthenticated] # <-- PROTECTS THE ENDPOINT

    def post(self, request, *args, **kwargs):
        """
        Creates a payment intent based on the total amount from the cart.
        """
        # Get the total amount from the frontend request
        total_amount = request.data.get('total_amount')

        if not total_amount:
            return Response({'error': 'Total amount is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Stripe expects the amount in the smallest currency unit (e.g., cents)
            amount_in_cents = int(float(total_amount) * 100)

            # Create a PaymentIntent with the order amount and currency
            intent = stripe.PaymentIntent.create(
                amount=amount_in_cents,
                currency='usd', # or your desired currency
                # You can add metadata to link the payment to the user for your records
                metadata={'user_id': request.user.id, 'username': request.user.username}
            )

            # Send the client secret back to the frontend
            return Response({
                'clientSecret': intent.client_secret
            })
        except Exception as e:
            # Handle potential errors, like invalid amounts
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# --- AUTHENTICATION VIEWS ---
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# --- PRODUCT & LIKED PRODUCT VIEWS ---
class ProductViewSet(viewsets.ModelViewSet):
    """
    This ViewSet provides complete CRUD functionality for products.
    """
    queryset = Product.objects.all().order_by('id')
    serializer_class = ProductSerializer

    # V V V --- FIX #1: ADD THIS MISSING METHOD --- V V V
    # This was the cause of your '500 Internal Server Error'.
    def get_serializer_context(self):
        """
        Pass the request context to the serializer. This is essential for
        the 'is_liked' field to work correctly.
        """
        return {'request': self.request}
    # ^ ^ ^ --- END OF FIX #1 --- ^ ^ ^

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]

# V V V --- FIX #2: ADD THIS ENTIRE NEW VIEW --- V V V
# This view is required for the category dropdown in the product form.
class CategoryListView(APIView):
    """
    Provides a simple list of all unique product categories.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        categories = Product.objects.values_list('category', flat=True).distinct().order_by('category')
        return Response(categories)
# ^ ^ ^ --- END OF FIX #2 --- ^ ^ ^


class LikedProductView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"error": "Product ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_440_NOT_FOUND)
        
        liked_product, created = LikedProduct.objects.get_or_create(user=request.user, product=product)
        
        if created:
            return Response({"status": "liked"}, status=status.HTTP_201_CREATED)
        else:
            liked_product.delete()
            return Response({"status": "unliked"}, status=status.HTTP_200_OK)

class LikedProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        liked_product_ids = LikedProduct.objects.filter(user=user).values_list('product_id', flat=True)
        return Product.objects.filter(id__in=liked_product_ids)

# --- ORDER VIEWS ---
class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderHistorySerializer
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# --- ADMIN DASHBOARD VIEW ---
class AdminDashboardView(APIView):
    """
    Provides comprehensive, multi-view data for the interactive admin dashboard.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        # ... (your existing dashboard logic is correct and remains unchanged)
        now = timezone.now()
        
        # KPIs
        all_orders = Order.objects.all()
        total_income = all_orders.aggregate(total=Sum('total_amount'))['total'] or 0
        total_orders_count = all_orders.count()
        total_users_count = User.objects.count()

        # Monthly data for last 12 months
        monthly_data_map = {}
        for i in range(12):
            month_date = now - datetime.timedelta(days=i*30)
            month_key = month_date.strftime('%Y-%m')
            monthly_data_map[month_key] = {'sales': 0, 'orders': 0}

        twelve_months_ago = now.date() - datetime.timedelta(days=365)
        monthly_query = Order.objects.filter(created_at__date__gte=twelve_months_ago)\
            .annotate(month=TruncMonth('created_at'))\
            .values('month')\
            .annotate(monthly_sales=Sum('total_amount'), monthly_orders=Count('id'))\
            .order_by('month')

        for item in monthly_query:
            month_key = item['month'].strftime('%Y-%m')
            if month_key in monthly_data_map:
                monthly_data_map[month_key]['sales'] = float(item['monthly_sales'])
                monthly_data_map[month_key]['orders'] = item['monthly_orders']
        
        sorted_months = sorted(monthly_data_map.keys())
        monthly_labels = [datetime.datetime.strptime(m, '%Y-%m').strftime('%b') for m in sorted_months]
        monthly_sales_data = [monthly_data_map[m]['sales'] for m in sorted_months]
        monthly_orders_data = [monthly_data_map[m]['orders'] for m in sorted_months]

        # Daily data for current month
        first_day_of_month = now.date().replace(day=1)
        _, last_day_num = calendar.monthrange(now.year, now.month)
        days_in_month = [first_day_of_month + datetime.timedelta(days=i) for i in range(last_day_num)]
        daily_data_map = {day.strftime('%d'): {'sales': 0, 'orders': 0} for day in days_in_month}
        daily_query = Order.objects.filter(created_at__date__range=[first_day_of_month, first_day_of_month.replace(day=last_day_num)])\
            .annotate(day=TruncDay('created_at')).values('day')\
            .annotate(daily_sales=Sum('total_amount'), daily_orders=Count('id')).order_by('day')
        
        for item in daily_query:
            day_str = item['day'].strftime('%d')
            daily_data_map[day_str]['sales'] = float(item['daily_sales'])
            daily_data_map[day_str]['orders'] = item['daily_orders']

        # Category sales data
        category_sales_data = OrderItem.objects.values('product__category')\
            .annotate(total_revenue=Sum('price'))\
            .order_by('-total_revenue')

        # Recent orders
        recent_orders = Order.objects.order_by('-created_at')[:5]
        
        data = {
            'kpis': { 
                'total_income': f"{total_income:,.2f}", 
                'total_orders': total_orders_count, 
                'total_users': total_users_count 
            },
            'main_chart': {
                'monthly': {
                    'labels': monthly_labels,
                    'sales_data': monthly_sales_data,
                    'orders_data': monthly_orders_data,
                },
                'daily': {
                    'labels': list(daily_data_map.keys()),
                    'sales_data': [v['sales'] for v in daily_data_map.values()],
                    'orders_data': [v['orders'] for v in daily_data_map.values()],
                }
            },
            'category_sales_chart': {
                'labels': [item['product__category'] or 'Uncategorized' for item in category_sales_data],
                'data': [float(item['total_revenue']) for item in category_sales_data],
            },
            'recent_transactions': OrderHistorySerializer(recent_orders, many=True).data,
        }
        
        return Response(data)


class CategoryListView(APIView):
    """
    Provides a list of all unique product categories.
    """
    # permission_classes = [IsAdminUser] # Uncomment if only admins should access this

    def get(self, request, format=None):
        """
        Return a list of all unique category strings.
        """
        # .values_list('category', flat=True) gets just the category strings
        # .distinct() ensures each category name appears only once
        categories = Product.objects.order_by('category').values_list('category', flat=True).distinct()
        
        return Response(list(categories))


# --- CHAT VIEWS ---
class ChatThreadView(generics.ListCreateAPIView):
    serializer_class = ChatThreadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            customer_threads = {}
            all_threads = ChatThread.objects.all().order_by('-updated_at')
            for thread in all_threads:
                customer = thread.participants.filter(is_staff=False).first()
                if customer and customer.id not in customer_threads:
                    customer_threads[customer.id] = thread
            return list(customer_threads.values())
        else:
            return ChatThread.objects.filter(participants=user).order_by('-updated_at')

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.is_staff:
            return Response(
                {"error": "Staff users cannot create new threads."},
                status=status.HTTP_403_FORBIDDEN
            )

        existing_thread = ChatThread.objects.filter(participants=user).first()
        if existing_thread:
            serializer = self.get_serializer([existing_thread], many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        customer = self.request.user
        staff_users = User.objects.filter(is_staff=True, is_active=True)
        participants = [customer] + list(staff_users)
        serializer.save(participants=participants)