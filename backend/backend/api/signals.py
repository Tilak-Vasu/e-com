from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from django.db import transaction
import logging

# --- Import both models and the new vector DB function ---
from .models import Product, Order, PolicyDocument
from .vector_db import (
    index_single_order,
    index_document,
    delete_document_from_index,
    index_single_product,
    delete_product_from_index,
)

# ✅ New import for Gemini
from langchain_google_genai import ChatGoogleGenerativeAI

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Product)
def generate_ai_tags_for_product(sender, instance, created, **kwargs):
    """
    This signal ONLY generates ai_tags for newly created products.
    """
    if not created:
        return
    if instance.ai_tags:
        return
    if kwargs.get("raw", False):
        return
    if kwargs.get("update_fields", None) is not None:
        return

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
        # ✅ Use LangChain wrapper instead of google.generativeai
        model = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.4,
        )
        response = model.invoke(prompt)

        if not response or not response.content:
            logger.warning(f"Empty AI response for product: {instance.name}")
            return

        tags = response.content.strip().lower()

        # Prevent signal recursion
        post_save.disconnect(generate_ai_tags_for_product, sender=Product)
        try:
            with transaction.atomic():
                Product.objects.filter(pk=instance.pk).update(ai_tags=tags)
                logger.info(f"Generated AI tags for new product: {instance.name}")
        finally:
            post_save.connect(generate_ai_tags_for_product, sender=Product)

    except Exception as e:
        logger.error(f"Error generating AI tags for {instance.name}: {e}")


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


@receiver(post_save, sender=Product)
def on_product_save(sender, instance, created, **kwargs):
    logger.info(f"Product saved (ID: {instance.id}). Triggering post-save signals...")

    # --- 1. AI Tag Generation for NEW products ---
    if created and not instance.ai_tags:
        product_details = (
            f"Product Name: {instance.name}. Category: {instance.category}. "
            f"Description: {instance.description or 'N/A'}. "
            f"SEO Keywords: {instance.seo_keywords or 'N/A'}"
        )
        prompt = f"""
        You are an e-commerce intelligence engine. Based on the product details below, generate a rich set of tags for internal system use (search and recommendations).
        **Your response MUST be a single string of comma-separated values and nothing else.**
        Generate 8 to 12 diverse, detailed keywords.
        Product Details: {product_details}
        """
        try:
            model = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.4,
            )
            response = model.invoke(prompt)
            tags = response.content.strip().lower() if response and response.content else None

            if tags:
                Product.objects.filter(pk=instance.pk).update(ai_tags=tags)
                logger.info(f"Successfully generated AI tags for new product: {instance.name}")
        except Exception as e:
            logger.error(f"Error generating AI tags for {instance.name}: {e}")

    # --- 2. Index the product in the vector DB ---
    try:
        index_single_product(instance)
    except Exception as e:
        logger.error(f"Failed to automatically index product {instance.id} on save: {e}")


@receiver(post_delete, sender=Product)
def on_product_delete(sender, instance, **kwargs):
    logger.info(f"Product deleted (ID: {instance.id}). Removing from vector index...")
    try:
        delete_product_from_index(instance.id)
    except Exception as e:
        logger.error(f"Failed to delete product {instance.id} from index: {e}")
