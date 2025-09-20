from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from django.db import transaction
import logging

# --- Import models and vector DB functions ---
from .models import Product, Order, PolicyDocument
from .vector_db import (
    index_single_order,
    index_document,
    delete_document_from_index,
    index_single_product,
    delete_product_from_index,
)

# --- Import for Gemini ---
from langchain_google_genai import ChatGoogleGenerativeAI

logger = logging.getLogger(__name__)


# --- Order and PolicyDocument Signals (Unchanged) ---

@receiver(post_save, sender=Order)
def on_order_saved(sender, instance, **kwargs):
    logger.info(f"Order {instance.id} saved. Indexing for chatbot...")
    try:
        index_single_order(instance)
    except Exception as e:
        logger.error(f"Failed to automatically index order {instance.id}: {e}")


@receiver(post_save, sender=PolicyDocument)
def on_document_save(sender, instance, **kwargs):
    print(f"Policy document '{instance.title}' saved. Indexing content...")
    try:
        index_document(instance)
    except Exception as e:
        logger.error(f"Failed to index document {instance.id} on save: {e}")


@receiver(post_delete, sender=PolicyDocument)
def on_document_delete(sender, instance, **kwargs):
    print(f"Policy document '{instance.title}' deleted. Removing from index...")
    try:
        delete_document_from_index(instance.id)
    except Exception as e:
        logger.error(f"Failed to delete document {instance.id} from index: {e}")


# --- Consolidated Product Signals ---

@receiver(post_save, sender=Product)
def on_product_save(sender, instance, created, **kwargs):
    """
    Consolidated signal for Product model.
    1. Generates AI tags ONLY for newly created products.
    2. Indexes the product in the vector DB on every save (create or update).
    """
    # --- 1. AI Tag Generation for NEW products ---
    # This block runs only when a new product is created and has no AI tags.
    # It includes robust checks from the old `generate_ai_tags_for_product` function.
    if created and not instance.ai_tags:
        logger.info(f"New product created (ID: {instance.id}). Generating AI tags...")
        product_details = (
            f"Product Name: {instance.name}. Category: {instance.category}. "
            f"Description: {instance.description or 'N/A'}. "
            f"SEO Keywords: {instance.seo_keywords or 'N/A'}"
        )
        prompt = f"""
        You are an e-commerce intelligence engine. Based on the product details below, generate a rich set of tags for internal system use (search and recommendations).
        **Your response MUST be a single string of comma-separated values and nothing else.**
        Generate 8 to 12 diverse, detailed keywords.
        For example: wireless, bluetooth, noise-cancelling, over-ear headphones, audio gear, travel, comfortable fit.

        Product Details:
        {product_details}
        """
        try:
            model = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",  # Corrected to a valid model, like 2.5-flash
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.4,
            )
            response = model.invoke(prompt)

            if response and response.content:
                tags = response.content.strip().lower()

                # Disconnect signal to prevent recursion on .update()
                post_save.disconnect(on_product_save, sender=Product)
                try:
                    with transaction.atomic():
                        Product.objects.filter(pk=instance.pk).update(ai_tags=tags)
                        # Manually update the instance in memory so the indexer gets the new tags
                        instance.ai_tags = tags
                        logger.info(f"Successfully generated and saved AI tags for: {instance.name}")
                finally:
                    # Reconnect signal for future saves
                    post_save.connect(on_product_save, sender=Product)
            else:
                logger.warning(f"Received an empty AI response for new product: {instance.name}")

        except Exception as e:
            logger.error(f"Error generating AI tags for {instance.name}: {e}")

    # --- 2. Index the product in the vector DB ---
    # This runs on every save (create and update) to keep the index fresh.
    logger.info(f"Product saved (ID: {instance.id}). Indexing in vector database...")
    try:
        index_single_product(instance)
    except Exception as e:
        logger.error(f"Failed to automatically index product {instance.id} on save: {e}")


@receiver(post_delete, sender=Product)
def on_product_delete(sender, instance, **kwargs):
    """
    Signal to remove the product from the vector index when it's deleted.
    """
    logger.info(f"Product deleted (ID: {instance.id}). Removing from vector index...")
    try:
        delete_product_from_index(instance.id)
    except Exception as e:
        logger.error(f"Failed to delete product {instance.id} from index: {e}")