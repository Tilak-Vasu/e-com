# api/management/commands/index_orders.py

from django.core.management.base import BaseCommand
from api.vector_db import index_all_orders

class Command(BaseCommand):
    help = 'Indexes all existing orders from the database into the ChromaDB vector store.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE('Starting the order indexing process...'))
        
        try:
            count = index_all_orders()
            if count > 0:
                self.stdout.write(self.style.SUCCESS(f'Successfully indexed {count} orders.'))
            else:
                self.stdout.write(self.style.WARNING('No new orders to index.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An error occurred during indexing: {e}'))