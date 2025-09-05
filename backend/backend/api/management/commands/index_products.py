# api/management/commands/index_products.py

from django.core.management.base import BaseCommand
from api.vector_db import index_all_products

class Command(BaseCommand):
    help = 'Indexes all existing products from the database into the ChromaDB vector store.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE('Starting the product indexing process...'))
        
        try:
            count = index_all_products()
            if count > 0:
                self.stdout.write(self.style.SUCCESS(f'Successfully indexed {count} products.'))
            else:
                self.stdout.write(self.style.WARNING('No products found to index.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An error occurred during product indexing: {e}'))