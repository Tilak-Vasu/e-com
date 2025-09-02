from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
# --- Import both models and the new vector DB function ---
from .models import Product, Order
from .vector_db import index_single_order
import google.generativeai as genai
import json
import logging
from django.db import transaction

logger = logging.getLogger(__name__)
genai.configure(api_key=settings.GEMINI_API_KEY)

@receiver(post_save, sender=Product)
def generate_ai_tags_for_product(sender, instance, created, **kwargs):
    """
    This signal ONLY generates ai_tags for newly created products.
    """
    
    # Only run for newly created products
    if not created:
        return
        
    # Skip if ai_tags already exist
    if instance.ai_tags:
        return
    
    # Skip if this is a raw save (from fixtures, management commands, etc.)
    if kwargs.get('raw', False):
        return
    
    # Skip if we're in a management command context
    update_fields = kwargs.get('update_fields', None)
    if update_fields is not None:
        return
    
    product_details = f"Product Name: {instance.name}. Category: {instance.category}. Description: {instance.description or 'N/A'}. SEO Keywords: {instance.seo_keywords or 'N/A'}"
    
    prompt = f"""
    You are an e-commerce intelligence engine. Based on the product details below, generate a rich set of tags for internal system use (search and recommendations).
    **Your response MUST be a single string of comma-separated values and nothing else.**
    Generate 8 to 12 diverse, detailed keywords.
    For example: wireless, bluetooth, noise-cancelling, over-ear headphones, audio gear, travel, comfortable fit.
    
    Product Details:
    {product_details}
    """
    
    try:
        # FIX: Remove 'models/' prefix
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"}
        ]
        
        response = model.generate_content(prompt, safety_settings=safety_settings)
        
        # Check if response has content
        if not response.text:
            logger.warning(f"Empty AI response for product: {instance.name}")
            return
        
        # The response is now just a string of tags, no JSON needed
        tags = response.text.strip().lower()
        
        # Prevent signal recursion by temporarily disconnecting
        post_save.disconnect(generate_ai_tags_for_product, sender=Product)
        
        try:
            # Update only the ai_tags field using atomic transaction
            with transaction.atomic():
                Product.objects.filter(pk=instance.pk).update(ai_tags=tags)
                logger.info(f"Generated AI tags for new product: {instance.name}")
        finally:
            # Reconnect the signal
            post_save.connect(generate_ai_tags_for_product, sender=Product)
    
    except Exception as e:
        logger.error(f"Error generating AI tags for {instance.name}: {e}")



@receiver(post_save, sender=Order)
def on_order_saved(sender, instance, **kwargs): #<-- Simplified signature
    """
    When an order is saved (created OR updated), index its latest data
    into the ChromaDB vector store for the chatbot.
    """
    # By removing 'if created:', this runs every time an order is saved,
    # ensuring the final total_amount is indexed correctly.
    logger.info(f"Order {instance.id} saved. Indexing for chatbot...")
    try:
        index_single_order(instance)
    except Exception as e:
        logger.error(f"Failed to automatically index order {instance.id}: {e}")