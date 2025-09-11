# api/management/commands/generate_ai_content.py
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db.models.signals import post_save
from api.models import Product
from langchain_google_genai import ChatGoogleGenerativeAI  # ✅ New import
import time

class Command(BaseCommand):
    help = 'Generates the internal AI Tags for any existing products that are missing them.'
    
    def handle(self, *args, **kwargs):
        self.stdout.write('Starting to generate AI tags for existing products...')
        
        # IMPORTANT: Disconnect any signals to prevent interference
        try:
            from api.signals import generate_ai_tags_for_product
            post_save.disconnect(generate_ai_tags_for_product, sender=Product)
            self.stdout.write('Signals temporarily disabled.')
        except ImportError:
            self.stdout.write('No signals to disconnect.')
        
        try:
            # ✅ Initialize Gemini via LangChain wrapper
            model = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.4
            )
            
            # Find products missing AI tags
            products_to_update = Product.objects.filter(ai_tags__isnull=True)
            if not products_to_update.exists():
                self.stdout.write(self.style.SUCCESS('All products already have AI tags.'))
                return
            
            self.stdout.write(f'Found {products_to_update.count()} products missing AI tags.')
            
            for product in products_to_update:
                self.stdout.write(f'Processing: {product.name}')
                
                product_details = f"Product Name: {product.name}. Category: {product.category}. Description: {product.description or 'N/A'}. SEO Keywords: {product.seo_keywords or 'N/A'}"
                
                prompt = f"""
                You are an e-commerce intelligence engine. Based on the product details below, generate a rich set of tags for internal system use (search and recommendations).
                **Your response MUST be a single string of comma-separated values and nothing else.**
                Generate 8 to 12 diverse, detailed keywords.
                For example: wireless, bluetooth, noise-cancelling, over-ear headphones, audio gear, travel, comfortable fit.
                
                Product Details:
                {product_details}
                """
                
                try:
                    # ✅ Call Gemini through LangChain
                    response = model.invoke(prompt)
                    
                    tags = response.content.strip().lower() if response and response.content else None
                    
                    if not tags:
                        self.stdout.write(self.style.ERROR(f'  Failed: Empty response from AI'))
                        continue
                    
                    # Update the product
                    product.ai_tags = tags
                    product.save(update_fields=['ai_tags'])
                    
                    self.stdout.write(f'  ✓ Generated tags: "{tags[:50]}..."')
                    self.stdout.write(self.style.SUCCESS(f'Successfully generated tags for: {product.name}'))
                    
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  Failed for {product.name}: {e}'))
                
                self.stdout.write('Waiting 2 seconds...')
                time.sleep(2)
        
        finally:
            # IMPORTANT: Reconnect signals when done
            try:
                from api.signals import generate_ai_tags_for_product
                post_save.connect(generate_ai_tags_for_product, sender=Product)
                self.stdout.write('Signals re-enabled.')
            except ImportError:
                pass
        
        self.stdout.write(self.style.SUCCESS('Finished processing products.'))
