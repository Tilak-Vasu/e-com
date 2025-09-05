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
from django.db.models.signals import post_save, post_delete # <-- Add post_delete
from .models import PolicyDocument # <-- Add PolicyDocument
from .vector_db import (
    index_single_order, 
    index_document, 
    delete_document_from_index,
    # --- NEW: Import the product indexing functions ---
    index_single_product,
    delete_product_from_index
)

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



# --- NEW SIGNALS FOR POLICY DOCUMENTS ---

@receiver(post_save, sender=PolicyDocument)
def on_document_save(sender, instance, **kwargs):
    """
    When a PolicyDocument is saved (created or updated),
    index its content into the vector DB.
    """
    print(f"Policy document '{instance.title}' saved. Indexing content...")
    try:
        index_document(instance)
    except Exception as e:
        logger.error(f"Failed to index document {instance.id} on save: {e}")

@receiver(post_delete, sender=PolicyDocument)
def on_document_delete(sender, instance, **kwargs):
    """
    When a PolicyDocument is deleted, remove its content
    from the vector DB.
    """
    print(f"Policy document '{instance.title}' deleted. Removing from index...")
    try:
        delete_document_from_index(instance.id)
    except Exception as e:
        logger.error(f"Failed to delete document {instance.id} from index: {e}")


@receiver(post_save, sender=Product)
def on_product_save(sender, instance, created, **kwargs):
    """
    When a Product is created or updated, this signal triggers two actions:
    1. Generates AI tags if it's a new product.
    2. Indexes/updates the product's data in the vector DB.
    """
    logger.info(f"Product saved (ID: {instance.id}). Triggering post-save signals...")
    
    # --- 1. AI Tag Generation for NEW products ---
    if created and not instance.ai_tags:
        product_details = f"Product Name: {instance.name}. Category: {instance.category}. Description: {instance.description or 'N/A'}. SEO Keywords: {instance.seo_keywords or 'N/A'}"
        prompt = f"""
        You are an e-commerce intelligence engine. Based on the product details below, generate a rich set of tags for internal system use (search and recommendations).
        **Your response MUST be a single string of comma-separated values and nothing else.**
        Generate 8 to 12 diverse, detailed keywords.
        Product Details: {product_details}
        """
        try:
            model = genai.GenerativeModel('models/gemini-1.5-flash')
            response = model.generate_content(prompt)
            tags = response.text.strip().lower()
            
            # Use .objects.filter().update() to avoid triggering the signal again
            Product.objects.filter(pk=instance.pk).update(ai_tags=tags)
            logger.info(f"Successfully generated AI tags for new product: {instance.name}")
        except Exception as e:
            logger.error(f"Error generating AI tags for {instance.name}: {e}")

    # --- 2. Index the product in the vector DB (for both create and update) ---
    try:
        index_single_product(instance)
    except Exception as e:
        logger.error(f"Failed to automatically index product {instance.id} on save: {e}")


@receiver(post_delete, sender=Product)
def on_product_delete(sender, instance, **kwargs):
    """
    When a Product is deleted, remove it from the vector DB.
    """
    logger.info(f"Product deleted (ID: {instance.id}). Removing from vector index...")
    try:
        delete_product_from_index(instance.id)
    except Exception as e:
        logger.error(f"Failed to delete product {instance.id} from index: {e}")
