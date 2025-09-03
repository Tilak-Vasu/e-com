# api/views.py
import math
from .vector_db import search_orders # <-- Import the RAG search function

# --- Python & Django Imports ---
import calendar
import datetime
from django.utils import timezone
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncMonth, TruncDay
from django.contrib.auth.models import User
from django.conf import settings
from django.db import transaction

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
from django.shortcuts import get_object_or_404 # A slightly more direct import

# ==========================================================
# --- CONFIGURATIONS ---
# ==========================================================
stripe.api_key = settings.STRIPE_SECRET_KEY

# api/views.py

# def get_batch_ai_inventory_insights(problem_products):
#     """
#     Takes a list of products with inventory issues and generates insights,
#     including a suggested order quantity based on previous month's sales, 
#     in a single API call.
#     """
#     if not problem_products:
#         return {} # Return an empty dict if there are no problems to analyze

#     # Format the input data into a clean, readable text block for the AI
#     product_data_string = "\n".join([
#         f"- Product: '{item['name']}', Last Month Sales: {item['sales']}, Current Stock: {item['stock']}"
#         for item in problem_products
#     ])

#     # --- THE UPDATED PROMPT ---
#     prompt = f"""
#     You are an expert e-commerce inventory analyst. Your task is to provide concise, actionable recommendations for a list of products with potential stock issues.

#     Analyze the following list of products:
#     {product_data_string}

#     Your response MUST be a valid JSON object. The keys of this object should be the exact product names from the list. The value for each key should be another JSON object with THREE keys: "status", "recommendation", and "suggested_order_quantity".

#     - "status": Must be "Critical" if stock is 0, otherwise it must be "Warning".
#     - "recommendation": A short, human-readable string (under 15 words) explaining the problem.
#     - "suggested_order_quantity": An integer. This should be based on the "Last Month Sales". As a simple rule, calculate this as (Last Month Sales * 1.5), rounding up to the nearest whole number to create a 20% safety stock. For out-of-stock items, this represents the ideal new stock level.

#     Example Response Format:
#     {{
#         "Aura Wireless Headphones": {{
#             "status": "Warning",
#             "recommendation": "Stock is critically low vs. sales. Reorder now.",
#             "suggested_order_quantity": 24
#         }},
#         "Compact Gaming Mouse": {{
#             "status": "Critical",
#             "recommendation": "Out of stock! Priority restock needed.",
#             "suggested_order_quantity": 60
#         }}
#     }}

#     Return ONLY the valid JSON object.
#     """

#     try:
#         model = genai.GenerativeModel('models/gemini-1.5-flash')
#         safety_settings = [ {"category": c, "threshold": "BLOCK_ONLY_HIGH"} for c in ["HARM_CATEGORY_HARASSMENT", "HARM_CATEGORY_HATE_SPEECH", "HARM_CATEGORY_SEXUALLY_EXPLICIT", "HARM_CATEGORY_DANGEROUS_CONTENT"]]
        
#         response = model.generate_content(prompt, safety_settings=safety_settings)
        
#         # Clean and parse the JSON response
#         json_string = response.text.strip().replace("```json", "").replace("```", "")
#         ai_insights_map = json.loads(json_string)
#         return ai_insights_map

#     except Exception as e:
#         logger.error(f"Gemini API batch inventory insight failed: {e}")
#         # On failure, return an empty map so the system doesn't crash
#         return {}
def get_batch_ai_inventory_insights(problem_products):
    """
    Takes a list of products with inventory issues (low stock OR unsold)
    and generates insights for all of them in a single API call.
    """
    if not problem_products:
        return {}

    # Format the input data, now including the problem type
    product_data_string = "\n".join([
        f"- Product: '{item['name']}', Current Stock: {item['stock']}, Problem: {item['problem']}"
        for item in problem_products
    ])

    # --- THE NEW, MORE POWERFUL PROMPT ---
    prompt = f"""
    You are an expert e-commerce inventory analyst. Your task is to provide concise, actionable recommendations for a list of products with different inventory problems.

    Analyze the following list of products:
    {product_data_string}

    Your response MUST be a valid JSON object. The keys of this object should be the exact product names from the list. The value for each key should be another JSON object with THREE keys: "status", "recommendation", and "suggested_order_quantity".

    Follow these rules based on the "Problem" type:

    1.  If the "Problem" is "Low Stock vs Sales":
        - "status": Must be "Critical" if stock is 0, otherwise it must be "Warning".
        - "recommendation": A short message urging an immediate reorder (e.g., "Stock is critically low vs. sales. Reorder now.").
        - "suggested_order_quantity": Calculate this as (Last Month Sales * 1.5), rounded up to the nearest whole number. This value is provided in the input.

    2.  If the "Problem" is "Unsold for over 3 months":
        - "status": Must be "Stale".
        - "recommendation": A short message suggesting clearance (e.g., "Stagnant stock. Consider a promotion or discount.").
        - "suggested_order_quantity": Must be 0.

    Example Response Format:
    {{
        "Aura Wireless Headphones": {{
            "status": "Warning",
            "recommendation": "Stock is critically low vs. sales. Reorder now.",
            "suggested_order_quantity": 24
        }},
        "Vintage Leather Journal": {{
            "status": "Stale",
            "recommendation": "Stagnant stock. Consider a promotion or discount.",
            "suggested_order_quantity": 0
        }}
    }}

    Return ONLY the valid JSON object.
    """

    try:
        model = genai.GenerativeModel('models/gemini-1.5-flash')
        safety_settings = [ {"category": c, "threshold": "BLOCK_ONLY_HIGH"} for c in ["HARM_CATEGORY_HARASSMENT", "HARM_CATEGORY_HATE_SPEECH", "HARM_CATEGORY_SEXUALLY_EXPLICIT", "HARM_CATEGORY_DANGEROUS_CONTENT"]]
        
        response = model.generate_content(prompt, safety_settings=safety_settings)
        
        json_string = response.text.strip().replace("```json", "").replace("```", "")
        ai_insights_map = json.loads(json_string)

        # Post-processing to add calculated order quantity for low stock items
        for item in problem_products:
            if item['problem'] == "Low Stock vs Sales" and item['name'] in ai_insights_map:
                suggested_quantity = math.ceil(item.get('sales', 0) * 1.5)
                ai_insights_map[item['name']]['suggested_order_quantity'] = suggested_quantity
        
        return ai_insights_map

    except Exception as e:
        logger.error(f"Gemini API batch inventory insight failed: {e}")
        return {}

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

from rest_framework import status
from functools import reduce
from django.db.models import Q, Count
from django.db.models import Case, When, IntegerField
import logging
# The 'reduce' function is great for this kind of operation
from functools import reduce 
import operator

logger = logging.getLogger(__name__)
import google.generativeai as genai
import json
genai.configure(api_key=settings.GEMINI_API_KEY)
from django.db.models.functions import Coalesce
 
from .moderation import moderate_text_with_gemini # Your new Gemini moderation function

class ProductViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD for products, AI content generation, AI search, and reviews.
    """
    # queryset = Product.objects.all().order_by('id')
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        """
        Overrides the default queryset to sort ALL products by sales volume.
        Products that have sold the most will appear first.
        """
        # Annotate every product with its total sales count.
        # Coalesce ensures that products never sold are treated as having 0 sales.
        queryset = Product.objects.annotate(
            total_sold=Coalesce(Sum('orderitem__quantity'), 0)
        )
        
        # Sort the entire list by the new 'total_sold' field (descending),
        # with a secondary sort by ID to ensure consistent ordering for items with equal sales.
        return queryset.order_by('-total_sold', '-id')

    @action(detail=False, methods=['get'], url_path='bestsellers')
    def bestsellers(self, request):
        """
        Calculates and returns a list of bestseller products, enhanced by AI tags.
        
        Logic:
        1. Identify the top 5 products with the highest sales volume (sum of quantity in OrderItem).
        2. Collect all unique AI tags from these top 5 products.
        3. Find other products (up to 10) that share these "trending" tags.
        4. Rank these other products by how many trending tags they match.
        5. Return a combined list, with the actual bestsellers first, followed by
           the AI-recommended similar products.
        """
        try:
            # 1. Identify the top 5 best-selling products by quantity sold
            top_products = Product.objects.annotate(
                total_sold=Sum('orderitem__quantity')
            ).filter(
                total_sold__gt=0
            ).order_by('-total_sold')[:5]

            top_product_ids = [p.id for p in top_products]

            # 2. Collect unique AI tags from these bestsellers
            trending_tags = set()
            for product in top_products:
                if product.ai_tags:
                    tags = [tag.strip() for tag in product.ai_tags.split(',') if tag.strip()]
                    trending_tags.update(tags)

            if not trending_tags:
                # If no bestsellers have tags, just return the bestsellers themselves
                serializer = self.get_serializer(top_products, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)

            # 3. Find other products matching these trending tags
            query_filter = Q()
            for tag in trending_tags:
                query_filter |= Q(ai_tags__icontains=tag)

            # 4. Rank them by relevance (how many trending tags they match)
            relevance_conditions = [
                Case(When(ai_tags__icontains=tag, then=1), default=0, output_field=IntegerField())
                for tag in trending_tags
            ]
            
            ai_recommended_products = Product.objects.filter(
                query_filter
            ).exclude(
                id__in=top_product_ids # Exclude the original bestsellers
            ).annotate(
                relevance_score=sum(relevance_conditions)
            ).filter(
                relevance_score__gt=0
            ).order_by('-relevance_score', '?')[:10] # Order by score, then randomize

            # 5. Combine the lists
            final_product_list = list(top_products) + list(ai_recommended_products)
            
            # Ensure uniqueness just in case, and limit total size
            final_products = list({p.id: p for p in final_product_list}.values())[:12]

            serializer = self.get_serializer(final_products, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            # Fallback to most recently added products if something goes wrong
            logger.error(f"Bestseller calculation failed: {str(e)}")
            fallback_products = Product.objects.all().order_by('-id')[:8]
            serializer = self.get_serializer(fallback_products, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

    # --- 1. AI SEARCH ENDPOINT FOR USERS ---
    @action(detail=False, methods=['get'], url_path='tag-search')
    def tag_search(self, request):
        query = request.query_params.get('query', None)
        if not query or len(query.strip()) < 3:
            products = Product.objects.all().order_by('id')
            serializer = self.get_serializer(products, many=True)
            return Response(serializer.data)

        stop_words = {'a', 'an', 'the', 'is', 'in', 'it', 'of', 'for', 'on', 'i', 'want', 'with', 'and', 'best'}
        keywords = [word for word in query.lower().split() if word not in stop_words]

        if not keywords:
             return Response(self.get_serializer(Product.objects.none(), many=True).data)

        query_filter = Q()
        for keyword in keywords:
            query_filter |= Q(name__icontains=keyword) | Q(ai_tags__icontains=keyword)

        relevance_conditions = [Q(ai_tags__icontains=kw) for kw in keywords]
        relevance = Count('id', filter=reduce(lambda a, b: a | b, relevance_conditions))

        results = Product.objects.filter(query_filter).annotate(
            relevance_score=relevance
        ).order_by('-relevance_score', 'id')

        serializer = self.get_serializer(results, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # --- 2. AI CONTENT GENERATION ENDPOINT FOR ADMINS ---
    # Improved generate_content method for your ProductViewSet

    @action(detail=False, methods=['post'], url_path='generate-content', permission_classes=[permissions.IsAdminUser])
    def generate_content(self, request):
        """
        Generate product description and SEO keywords using AI
        """
        product_name = request.data.get('name')
        category = request.data.get('category')
        
        # Validate required fields
        if not product_name or not category:
            return Response({
                "error": "Both 'name' and 'category' are required.",
                "details": {
                    "name": "Required" if not product_name else "OK",
                    "category": "Required" if not category else "OK"
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Clean inputs
        product_name = product_name.strip()
        category = category.strip()
        
        if not product_name or not category:
            return Response({
                "error": "Name and category cannot be empty strings."
            }, status=status.HTTP_400_BAD_REQUEST)

        prompt = f"""
    Generate product marketing content for an e-commerce website.

    Product Name: {product_name}
    Category: {category}

    Return ONLY a valid JSON object with exactly these two keys:
    {{
    "description": "Write a compelling product description (80-120 words) that highlights key features, benefits, and appeal to customers.",
    "seo_keywords": "Provide 5-7 relevant SEO keywords separated by commas, focusing on search terms customers would use"
    }}

    Do not include any markdown, code blocks, or additional text. Return only the JSON object.
    """

        try:
            # Import here to avoid import issues if not installed
            import google.generativeai as genai
            
            # Initialize the model
            model = genai.GenerativeModel('models/gemini-1.5-flash')
            
            # Configure safety settings
            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
            ]
            
            # Generate content
            response = model.generate_content(prompt, safety_settings=safety_settings)
            
            # Check if response is blocked or empty
            if not response.text:
                finish_reason = 'UNKNOWN'
                if response.candidates and len(response.candidates) > 0:
                    finish_reason = response.candidates[0].finish_reason
                    
                return Response({
                    "error": f"AI service returned empty response. Reason: {finish_reason}",
                    "fallback_used": False
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Clean the response text
            json_string = response.text.strip()
            
            # Remove common markdown artifacts
            if json_string.startswith("```json"):
                json_string = json_string[7:]
            if json_string.startswith("```"):
                json_string = json_string[3:]
            if json_string.endswith("```"):
                json_string = json_string[:-3]
            
            json_string = json_string.strip()
            
            # Parse JSON
            try:
                content = json.loads(json_string)
            except json.JSONDecodeError as json_error:
                # Log the problematic response for debugging
                logger.error(f"JSON parsing failed. Raw response: {response.text}")
                logger.error(f"Cleaned string: {json_string}")
                logger.error(f"JSON Error: {json_error}")
                
                # Provide fallback content
                content = {
                    "description": f"Experience the exceptional quality of {product_name}. This premium product in our {category} collection combines innovative design with superior functionality. Perfect for discerning customers who value both performance and style, it delivers outstanding results that exceed expectations.",
                    "seo_keywords": f"{product_name.lower()}, {category.lower()}, buy {product_name.lower()}, premium {category.lower()}, {product_name.lower()} online, best {category.lower()}, quality {product_name.lower()}"
                }
                
                return Response({
                    "data": content,
                    "fallback_used": True,
                    "message": "AI parsing failed, fallback content provided",
                    "debug_info": {
                        "raw_response": response.text[:200] + "..." if len(response.text) > 200 else response.text,
                        "json_error": str(json_error)
                    }
                }, status=status.HTTP_200_OK)
            
            # Validate the parsed content has required keys
            if not isinstance(content, dict) or 'description' not in content or 'seo_keywords' not in content:
                # Provide fallback content
                content = {
                    "description": f"Discover the outstanding {product_name} from our {category} collection. This carefully crafted product offers exceptional value and performance, designed to meet the highest standards of quality and customer satisfaction.",
                    "seo_keywords": f"{product_name.lower()}, {category.lower()}, buy {product_name.lower()}, {category.lower()} online, premium {product_name.lower()}, best {category.lower()}"
                }
                
                return Response({
                    "data": content,
                    "fallback_used": True,
                    "message": "AI response missing required fields, fallback content provided"
                }, status=status.HTTP_200_OK)
            
            # Ensure strings are not empty
            if not content.get('description', '').strip():
                content['description'] = f"Exceptional {product_name} available in our {category} collection. High-quality product designed for superior performance and customer satisfaction."
            
            if not content.get('seo_keywords', '').strip():
                content['seo_keywords'] = f"{product_name.lower()}, {category.lower()}, buy {product_name.lower()}, {category.lower()} online"
            
            # Return successful response
            return Response({
                "data": content,
                "fallback_used": False,
                "message": "Content generated successfully"
            }, status=status.HTTP_200_OK)
            
        except ImportError:
            return Response({
                "error": "Google Generative AI library not available",
                "details": "Please install google-generativeai package"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        except Exception as e:
            logger.error(f"AI content generation error: {str(e)}", exc_info=True)
            
            # Provide fallback content even for unexpected errors
            fallback_content = {
                "description": f"Premium {product_name} from our {category} collection. This high-quality product is designed to deliver exceptional performance and value, meeting the needs of discerning customers who appreciate excellence.",
                "seo_keywords": f"{product_name.lower()}, {category.lower()}, buy {product_name.lower()}, premium {category.lower()}, {product_name.lower()} online, quality {category.lower()}"
            }
            
            return Response({
                "data": fallback_content,
                "fallback_used": True,
                "message": "AI service error, fallback content provided",
                "error_details": str(e)
            }, status=status.HTTP_200_OK)


    # --- 3. AI RECOMMENDATIONS ENDPOINT FOR PRODUCT PAGES ---
    # @action(detail=True, methods=['get'], url_path='recommendations')
    # def recommendations(self, request, pk=None):
    #     try:
    #         target_product = self.get_object()
    #         if not target_product.ai_tags:
    #             return Response([], status=status.HTTP_200_OK)

    #         target_tags = [tag.strip() for tag in target_product.ai_tags.split(',') if tag.strip()]
    #         if not target_tags:
    #             return Response([], status=status.HTTP_200_OK)

    #         query_filter = Q()
    #         for tag in target_tags:
    #             query_filter |= Q(ai_tags__icontains=tag)
            
    #         matching_products = Product.objects.filter(query_filter).exclude(pk=pk).distinct()

    #         relevance_conditions = [Q(ai_tags__icontains=tag) for tag in target_tags]
    #         relevance = Count('id', filter=reduce(lambda a, b: a | b, relevance_conditions))
            
    #         ranked_results = matching_products.annotate(
    #             relevance_score=relevance
    #         ).order_by('-relevance_score', 'id')

    #         top_4_recommendations = ranked_results[:4]
    #         serializer = self.get_serializer(top_4_recommendations, many=True)
    #         return Response(serializer.data, status=status.HTTP_200_OK)
    #     except Product.DoesNotExist:
    #         return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
    #     except Exception as e:
    #         return Response({"error": "Could not generate recommendations."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    @action(detail=True, methods=['get'], url_path='recommendations')
    def recommendations(self, request, pk=None):
        """
        Generates a hybrid list of up to 10 product recommendations.
        It combines up to 10 products from the same category with up to 10
        products that are semantically similar based on AI tags.
        """
        try:
            target_product = self.get_object()
            
            # --- 1. Get Recommendations from the Same Category ---
            category_recs = []
            if target_product.category:
                category_recs = list(Product.objects.filter(
                    category=target_product.category
                ).exclude(pk=pk).order_by('?')[:10]) # Get 10 random products

            # --- 2. Get Recommendations from Similar AI Tags ---
            tag_recs = []
            if target_product.ai_tags:
                target_tags = [tag.strip() for tag in target_product.ai_tags.split(',') if tag.strip()]
                if target_tags:
                    tag_query_filter = Q()
                    for tag in target_tags:
                        tag_query_filter |= Q(ai_tags__icontains=tag)
                    
                    relevance_conditions = [Q(ai_tags__icontains=tag) for tag in target_tags]
                    relevance = Count('id', filter=reduce(lambda a, b: a | b, relevance_conditions))
                    
                    tag_recs = list(Product.objects.filter(
                        tag_query_filter
                    ).exclude(pk=pk).distinct().annotate(
                        relevance_score=relevance
                    ).order_by('-relevance_score', '?')[:10]) # Get top 10 most similar

            # --- 3. Combine and De-duplicate the Lists ---
            # We use a dictionary to ensure each product appears only once.
            combined_recs = {}
            # Add tag-based recommendations first, as they are often more relevant
            for product in tag_recs:
                combined_recs[product.id] = product
            # Add category-based recommendations, which will fill in the gaps without adding duplicates
            for product in category_recs:
                if product.id not in combined_recs:
                    combined_recs[product.id] = product
            
            # Convert back to a list and ensure we have a max of 10
            final_recommendations = list(combined_recs.values())[:10]

            serializer = self.get_serializer(final_recommendations, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": "Could not generate recommendations."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)    

    # --- 4. ALL YOUR ORIGINAL/STANDARD METHODS ARE PRESERVED ---
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductWriteSerializer
        return ProductReadSerializer

    def get_serializer_context(self):
        return {'request': self.request}

    def get_permissions(self):
        # Updated to allow public access to all necessary 'read' and 'search' actions
        if self.action in ['list', 'retrieve', 'tag_search', 'recommendations','bestsellers'] or \
           (self.action == 'reviews' and self.request.method == 'GET'):
            return [permissions.AllowAny()]
        if self.action == 'reviews' and self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        # All other actions (create, update, destroy, generate_content) default to admin-only
        return [permissions.IsAdminUser()]

    def create(self, request, *args, **kwargs):
        logger.info("=== CREATE PRODUCT DEBUG ===")
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        else:
            logger.error(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        logger.info("=== UPDATE PRODUCT DEBUG ===")
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            self.perform_update(serializer)
            return Response(serializer.data)
        else:
            logger.error(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'post'], url_path='reviews')
    def reviews(self, request, pk=None):
        """
        Handles listing (GET) and creating (POST) reviews for a specific product,
        with automated content moderation using Gemini.
        """
        product = self.get_object()

        # --- GET Request Logic (for listing existing reviews) ---
        if request.method == 'GET':
            reviews = product.reviews.all()
            serializer = ProductReviewSerializer(reviews, many=True)
            return Response(serializer.data)

        # --- POST Request Logic (for creating a new review) ---
        elif request.method == 'POST':
            review_text = request.data.get('text', '')
            
            # 1. Moderate the text using our new Gemini function
            if moderate_text_with_gemini(review_text):
                # 2. If flagged, reject the request with a specific error message
                return Response(
                    {"detail": "This review cannot be posted because it violates our content policy. Please revise your review."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 3. If the text is clean, proceed with the normal saving process
            serializer = ProductReviewSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                serializer.save(author=request.user, product=product)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            # Return validation errors if the serializer finds any (e.g., empty text)
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
import datetime
from django.utils import timezone

class AdminDashboardView(APIView):
    """
    Provides aggregated data for the admin dashboard, including KPIs,
    performance charts, and AI-powered inventory insights.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        # --- Overall KPIs & Chart Logic (Unchanged) ---
        all_orders = Order.objects.all()
        total_income = all_orders.aggregate(total=Sum('total_amount'))['total'] or 0
        total_orders_count = all_orders.count()
        total_users_count = User.objects.count()

        now = timezone.now()
        try:
            selected_year = int(request.query_params.get('year', now.year))
        except (ValueError, TypeError):
            selected_year = now.year

        first_order = Order.objects.order_by('created_at').first()
        start_year = first_order.created_at.year if first_order else now.year
        available_years = list(range(start_year, now.year + 1))

        # Monthly Performance Data
        monthly_labels, monthly_sales_data, monthly_orders_data = [], [], []
        last_month = 12 if selected_year < now.year else now.month

        for month in range(1, last_month + 1):
            month_name = datetime.date(selected_year, month, 1).strftime('%b')
            monthly_labels.append(month_name)
            _, num_days = calendar.monthrange(selected_year, month)
            month_start = timezone.make_aware(datetime.datetime(selected_year, month, 1))
            month_end = timezone.make_aware(datetime.datetime(selected_year, month, num_days, 23, 59, 59))
            monthly_sales = Order.objects.filter(created_at__range=(month_start, month_end)).aggregate(total=Sum('total_amount'))['total'] or 0
            monthly_orders = Order.objects.filter(created_at__range=(month_start, month_end)).count()
            monthly_sales_data.append(float(monthly_sales))
            monthly_orders_data.append(monthly_orders)

        # Daily Performance Data
        target_date_for_daily = datetime.date(selected_year, last_month, 1) if selected_year < now.year else now.date()
        first_day_of_month = target_date_for_daily.replace(day=1)
        _, last_day_num = calendar.monthrange(target_date_for_daily.year, target_date_for_daily.month)
        last_day_of_month = target_date_for_daily.replace(day=last_day_num)
        days_in_month_labels = [str(d).zfill(2) for d in range(1, last_day_num + 1)]
        daily_data_map = {label: {'sales': 0, 'orders': 0} for label in days_in_month_labels}
        daily_query = Order.objects.filter(created_at__date__range=(first_day_of_month, last_day_of_month)).annotate(day=TruncDay('created_at')).values('day').annotate(daily_sales=Sum('total_amount'), daily_orders=Count('id')).order_by('day')
        for item in daily_query:
            day_str = item['day'].strftime('%d')
            if day_str in daily_data_map:
                daily_data_map[day_str]['sales'] = float(item['daily_sales'])
                daily_data_map[day_str]['orders'] = item['daily_orders']

        # --- AI-Powered Inventory Insights Logic ---
        today = timezone.now().date()
        
        first_day_of_current_month = today.replace(day=1)
        last_day_of_previous_month = first_day_of_current_month - datetime.timedelta(days=1)
        first_day_of_previous_month = last_day_of_previous_month.replace(day=1)
        sales_data = OrderItem.objects.filter(
            order__created_at__date__range=(first_day_of_previous_month, last_day_of_previous_month)
        ).values('product_id').annotate(previous_month_sales=Sum('quantity'))
        sales_map = {item['product_id']: item['previous_month_sales'] for item in sales_data}

        three_months_ago = today - datetime.timedelta(days=90)
        sold_in_last_3_months_ids = OrderItem.objects.filter(
            order__created_at__date__gte=three_months_ago
        ).values_list('product_id', flat=True).distinct()
        
        unsold_product_ids = Product.objects.filter(
            stock_quantity__gt=0
        ).exclude(id__in=sold_in_last_3_months_ids).values_list('id', flat=True)

        all_products = Product.objects.all()
        problem_products_for_ai = []
        problem_product_ids = set()

        for product in all_products:
            last_month_sales = sales_map.get(product.id, 0)
            current_stock = product.stock_quantity
            
            is_low_stock = current_stock == 0 or current_stock < 5 or (last_month_sales > 0 and current_stock < last_month_sales)
            if is_low_stock and product.id not in problem_product_ids:
                problem_products_for_ai.append({
                    "name": product.name, "sales": last_month_sales,
                    "stock": current_stock, "problem": "Low Stock vs Sales",
                })
                problem_product_ids.add(product.id)

            if product.id in unsold_product_ids and product.id not in problem_product_ids:
                problem_products_for_ai.append({
                    "name": product.name, "stock": current_stock,
                    "problem": "Unsold for over 3 months",
                })
                problem_product_ids.add(product.id)

        all_product_insights = [{
            "product_id": p.id, "product_name": p.name,
            "previous_month_sales": sales_map.get(p.id, 0),
            "current_stock": p.stock_quantity, "ai_status": "OK",
            "ai_recommendation": "Stock is sufficient.", "suggested_order_quantity": 0
        } for p in all_products]

        ai_insights_map = get_batch_ai_inventory_insights(problem_products_for_ai)
        
        for insight in all_product_insights:
            if insight["product_name"] in ai_insights_map:
                ai_data = ai_insights_map[insight["product_name"]]
                insight.update({
                    "ai_status": ai_data.get("status", "Error"),
                    "ai_recommendation": ai_data.get("recommendation", "N/A"),
                    "suggested_order_quantity": ai_data.get("suggested_order_quantity", 0)
                })

        # --- THIS IS THE CRUCIAL CORRECTION ---
        # 1. Filter the list to only include items that are NOT "OK".
        problematic_inventory_insights = [
            insight for insight in all_product_insights if insight['ai_status'] != 'OK'
        ]
        
        # 2. Sort the filtered list by severity.
        status_order = {'Critical': 0, 'Warning': 1, 'Stale': 2}
        problematic_inventory_insights.sort(key=lambda x: status_order.get(x['ai_status'], 99))
        
        # --- Sales by Category & Recent Transactions Widgets (Unchanged) ---
        all_categories = list(
            Product.objects.filter(category__isnull=False, category__gt='')
                           .values_list('category', flat=True)
                           .distinct().order_by('category')
        )
        category_sales_query = OrderItem.objects.values('product__category').annotate(
            total_revenue=Sum(F('quantity') * F('price'))
        )
        sales_revenue_map = {
            item['product__category']: float(item['total_revenue']) 
            for item in category_sales_query if item['product__category']
        }
        category_labels, category_data = [], []
        for category_name in all_categories:
            category_labels.append(category_name)
            revenue = sales_revenue_map.get(category_name, 0.0) 
            category_data.append(revenue)
        
        uncategorized_sales = OrderItem.objects.filter(product__category__isnull=True).aggregate(
            total_revenue=Sum(F('quantity') * F('price'))
        )['total_revenue'] or 0.0
        if uncategorized_sales > 0:
            category_labels.append('Uncategorized')
            category_data.append(float(uncategorized_sales))

        recent_transactions = Order.objects.select_related('user').order_by('-created_at')[:5]
        
        # --- Final Data Structure for API Response ---
        data = {
            'kpis': { 
                'total_income': f"{total_income:,.2f}", 
                'total_orders': total_orders_count, 
                'total_users': total_users_count 
            },
            'chart_meta': {
                'selected_year': selected_year,
                'available_years': available_years,
            },
            'main_chart': {
                'monthly': { 
                    'labels': monthly_labels, 
                    'sales_data': monthly_sales_data, 
                    'orders_data': monthly_orders_data 
                },
                'daily': { 
                    'labels': list(daily_data_map.keys()), 
                    'sales_data': [v['sales'] for v in daily_data_map.values()], 
                    'orders_data': [v['orders'] for v in daily_data_map.values()] 
                }
            },
            'category_sales_chart': { 
                'labels': category_labels, 
                'data': category_data 
            },
            'recent_transactions': OrderHistorySerializer(recent_transactions, many=True, context={'request': request}).data,
            # ✨ Use the filtered and sorted list here
            'inventory_insights': problematic_inventory_insights
        }
        return Response(data)

# ==========================================================
# --- CHAT VIEWS ---
# ==========================================================

class ChatThreadView(generics.ListCreateAPIView):
    """
    Handles the creation and listing of chat threads.
    - Customers can see and create their own single thread.
    - Staff can see a list of the most recent thread for each customer.
    """
    serializer_class = ChatThreadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            # For staff, get the latest thread for each unique customer
            customer_threads, seen_customers = {}, set()
            all_customer_threads = ChatThread.objects.filter(participants__is_staff=False).distinct().order_by('-updated_at')
            for thread in all_customer_threads:
                customer = thread.participants.filter(is_staff=False).first()
                if customer and customer.id not in seen_customers:
                    customer_threads[customer.id] = thread
                    seen_customers.add(customer.id)
            return list(customer_threads.values())
        else:
            # For customers, just get their own thread
            return ChatThread.objects.filter(participants=user)

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.is_staff:
            return Response({"error": "Staff cannot create threads this way."}, status=status.HTTP_403_FORBIDDEN)
        
        # If the customer already has a thread, return it instead of creating a new one
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


from .models import UserCart, CartItem # Import the new models
from .serializers import UserCartSerializer # Import the new serializer

class CartView(APIView):
    """
    Handles loading and saving the user's persistent shopping cart.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Loads the user's cart from the database and returns a list of
        fully detailed cart items that match the frontend's CartItem type.
        """
        cart, created = UserCart.objects.get_or_create(user=request.user)
        
        cart_items_data = []
        for item in cart.items.all():
            product_data = ProductReadSerializer(item.product, context={'request': request}).data
            product_data['quantity'] = item.quantity
            cart_items_data.append(product_data)
            
        return Response(cart_items_data)

    def post(self, request, *args, **kwargs):
        """
        Saves/synchronizes the current cart state from the frontend to the database.
        """
        cart, created = UserCart.objects.get_or_create(user=request.user)
        items_data = request.data.get('items', [])
        
        try:
            with transaction.atomic():
                cart.items.all().delete()
                
                new_cart_items = []
                for item_data in items_data:
                    product_id = item_data.get('id')
                    quantity = item_data.get('quantity')

                    if not product_id or not isinstance(quantity, int) or quantity <= 0:
                        logger.warning(f"Skipping malformed cart item data for user {request.user.id}: {item_data}")
                        continue
                    
                    try:
                        product = Product.objects.get(id=product_id)
                        
                        # --- THE FIX: Add the missing fields when creating the CartItem ---
                        new_cart_items.append(
                            CartItem(
                                cart=cart,
                                product=product,
                                quantity=quantity,
                                # These fields are required by your model's definition
                                price_at_addition=product.price,
                                stock_at_update=product.stock_quantity
                            )
                        )
                    except Product.DoesNotExist:
                        logger.error(f"Cart sync failed for user {request.user.id}: Product with ID {product_id} not found.")
                        continue
                
                if new_cart_items:
                    CartItem.objects.bulk_create(new_cart_items)
            
            return Response({"status": "Cart synchronized successfully"}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Cart synchronization failed for user {request.user.id}: {e}", exc_info=True)
            return Response({"error": "Failed to synchronize cart state due to an internal error."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

from .vector_db import search_orders # <-- Import the RAG search function

from .models import ChatThread, ChatMessage # <-- Import the chat models

# ==========================================================
# --- AI CHATBOT VIEW (NEW) ---
# ==========================================================

# class ChatbotView(APIView):
#     permission_classes = [permissions.IsAuthenticated]

#     def post(self, request, *args, **kwargs):
#         user_query = request.data.get('query')
#         if not user_query:
#             return Response({"error": "Query is required."}, status=status.HTTP_400_BAD_REQUEST)

#         # 1. Use RAG to find the most relevant order for the current user
#         relevant_orders = search_orders(query=user_query, user_id=request.user.id, n_results=1)

#         # 2. Prepare the context for the AI
#         context_string = ""
#         if not relevant_orders:
#             # If RAG finds nothing, the context is empty.
#             context_string = "No relevant order information was found for this user."
#         else:
#             # If an order is found, augment it with our business logic
#             context_order = relevant_orders[0]
#             context_order['status'] = 'shipped' # Add the required status as per instructions
            
#             # Create a clean string of the context for the LLM
#             context_string = ", ".join([f"{key.replace('_', ' ')} is {value}" for key, value in context_order.items()])

#         # 3. Create the prompt for the Gemini LLM
#         prompt = f"""
#         You are a friendly and helpful customer service chatbot for an e-commerce store called 'E-Shop'.
#         Your goal is to answer the user's question based ONLY on the context provided about their order.
#         Do not make up any information. If the context says no order was found, politely inform the user you could not find the order and ask for more details like an order number.
        
#         Here is the user's order information (the context):
#         CONTEXT: "{context_string}"
        
#         Here is the user's question:
#         QUESTION: "{user_query}"
        
#         Based on the context, provide a concise, friendly, and helpful answer.
#         """

#         try:
#             # 4. Call the Gemini API
#             model = genai.GenerativeModel('models/gemini-2.5-flash')
#             response = model.generate_content(prompt)
#             ai_response = response.text

#             return Response({"response": ai_response})
        
#         except Exception as e:
#             logger.error(f"Chatbot LLM error: {e}")
#             return Response({"error": "The AI service is currently unavailable. Please try again later."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)



from rest_framework.views import APIView
from asgiref.sync import sync_to_async, async_to_sync

class ChatbotView(APIView):
    """
    A stateful, RAG-powered chatbot that remembers conversation history.
    """
    permission_classes = [permissions.IsAuthenticated]

    # --- Asynchronous helper methods for clean database access ---

    @sync_to_async
    def get_or_create_chatbot_thread(self, user):
        """
        Safely finds or creates the primary chat thread for a specific user.
        This is more robust than using get_or_create on a ManyToManyField.
        """
        # First, try to find an existing thread where this user is a participant.
        # .first() safely returns the first object or None, without crashing.
        thread = ChatThread.objects.filter(participants=user).first()
        
        if thread:
            # If a thread was found, simply return it.
            return thread
        else:
            # If no thread was found, create a new one.
            new_thread = ChatThread.objects.create(
                name=f'Primary Chat - {user.username}'
            )
            # Add the customer
            new_thread.participants.add(user)
            # Find and add all active staff members
            staff_users = User.objects.filter(is_staff=True, is_active=True)
            if staff_users.exists():
                new_thread.participants.add(*staff_users)
            
            return new_thread

    @sync_to_async
    def get_recent_history(self, thread):
        """Retrieves the last turn of the conversation (1 user msg, 1 AI msg) for short-term memory."""
        messages = ChatMessage.objects.filter(thread=thread).order_by('-timestamp')[:2]
        # Reverse the messages to get them in chronological order
        history = "\n".join([
            f"{'Human' if not msg.sender.is_staff else 'AI'}: {msg.text}"
            for msg in reversed(messages)
        ])
        return history

    @sync_to_async
    def save_chat_message(self, thread, user, text):
        """Saves a single message to the database."""
        return ChatMessage.objects.create(thread=thread, sender=user, text=text)

    @sync_to_async
    def get_ai_user(self):
        """Finds a staff user to be the sender of the AI's messages."""
        return User.objects.filter(is_staff=True).first()

    # --- The main API endpoint logic ---
    def post(self, request, *args, **kwargs):
        user_query = request.data.get('query')
        if not user_query:
            return Response({"error": "Query is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        
        try:
            # Use async_to_sync to run our async logic within the sync DRF view
            response_text = async_to_sync(self._process_chat_async)(user, user_query)
            return Response({"response": response_text})
        except Exception as e:
            logger.error(f"Chatbot error for user {user.id}: {e}", exc_info=True)
            return Response(
                {"error": "I'm sorry, the AI service is currently unavailable. Please try again in a moment."}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

    async def _process_chat_async(self, user, user_query):
        """
        The core async processing logic for handling a chat message.
        """
        thread = await self.get_or_create_chatbot_thread(user)
        
        # 1. Get recent conversation history for short-term memory
        last_history = await self.get_recent_history(thread)
        
        # 2. Save the user's new message to the database immediately
        await self.save_chat_message(thread, user, user_query)

        # 3. Always run the RAG search to get the most relevant order context
        logger.info(f"User '{user.username}' sent a message. Running RAG search for context...")
        
        relevant_orders = await sync_to_async(search_orders)(
            query=user_query, 
            user_id=user.id, 
            n_results=5 # Fetch a few orders to handle general questions
        )
        
        # 4. Build the context string for the AI prompt
        context_string = "No relevant orders were found in the user's history for this query."
        if relevant_orders:
            order_summaries = []
            for order_data in relevant_orders:
                summary = (
                    f"Order #{order_data.get('order_id')} "
                    f"(Total: ${order_data.get('total_amount', 0):.2f}, "
                    f"Date: {order_data.get('date', '').split('T')[0]}) "
                    f"containing products: {order_data.get('products', 'N/A')}."
                )
                order_summaries.append(summary)
            
            context_string = "\n".join(order_summaries)
        
        # 5. Build the final prompt with history and context
        final_prompt = f"""
        You are a helpful and friendly e-commerce assistant for 'E-Shop'.

        Here is the recent conversation history:
        <history>
        {last_history}
        </history>
        
        Here is a summary of the user's most relevant orders from our database. Use this information to answer the question.
        <context>
        {context_string}
        </context>
        
        Please answer the user's NEWEST question based on the history and the context provided. Be concise and conversational.
        
        NEWEST QUESTION: "{user_query}"
        """

        # 6. Call Gemini for the final answer
        model = genai.GenerativeModel('gemini-2.5-flash')
        main_response = await model.generate_content_async(final_prompt)
        ai_response_text = main_response.text.strip()
        
        # 7. Save the AI's response to the database
        ai_user = await self.get_ai_user()
        if ai_user:
            await self.save_chat_message(thread, ai_user, ai_response_text)
        else:
            logger.warning("No staff user found to act as the AI sender. AI response was not saved.")
        
        return ai_response_text
    
