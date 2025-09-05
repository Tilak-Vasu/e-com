import time
from django.core.management.base import BaseCommand, CommandError

# Import the vector_db module itself so we can access its global variables
from api import vector_db
from api.models import PolicyDocument

class Command(BaseCommand):
    help = """
    Manages the ChromaDB vector database. 
    Can be used to clear and re-index all documents from the Django database.
    """

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Deletes all existing collections before re-indexing.',
        )
        parser.add_argument('--orders', action='store_true', help='Only re-index orders.')
        parser.add_argument('--products', action='store_true', help='Only re-index products.')
        parser.add_argument('--documents', action='store_true', help='Only re-index policy documents.')

    def handle(self, *args, **options):
        start_time = time.time()
        
        run_all = not (options['orders'] or options['products'] or options['documents'])

        if options['clear']:
            self.stdout.write(self.style.WARNING("--- Option --clear specified. Deleting all ChromaDB collections... ---"))
            try:
                vector_db.client.delete_collection(name=vector_db.COLLECTION_NAME)
                self.stdout.write(self.style.SUCCESS(f"  > Successfully deleted '{vector_db.COLLECTION_NAME}' collection."))
            except Exception as e:
                self.stdout.write(self.style.NOTICE(f"  > Could not delete '{vector_db.COLLECTION_NAME}' collection (it may not exist): {e}"))
            
            try:
                vector_db.client.delete_collection(name=vector_db.PRODUCTS_COLLECTION_NAME)
                self.stdout.write(self.style.SUCCESS(f"  > Successfully deleted '{vector_db.PRODUCTS_COLLECTION_NAME}' collection."))
            except Exception as e:
                self.stdout.write(self.style.NOTICE(f"  > Could not delete '{vector_db.PRODUCTS_COLLECTION_NAME}' collection (it may not exist): {e}"))

            try:
                vector_db.client.delete_collection(name=vector_db.DOCUMENTS_COLLECTION_NAME)
                self.stdout.write(self.style.SUCCESS(f"  > Successfully deleted '{vector_db.DOCUMENTS_COLLECTION_NAME}' collection."))
            except Exception as e:
                self.stdout.write(self.style.NOTICE(f"  > Could not delete '{vector_db.DOCUMENTS_COLLECTION_NAME}' collection (it may not exist): {e}"))
            self.stdout.write("\n")

            # --- THIS IS THE CRITICAL FIX ---
            # After deleting the collections, the global variables in vector_db.py are now stale.
            # We must re-initialize them by calling get_or_create_collection again.
            self.stdout.write(self.style.HTTP_INFO("Re-initializing collection objects..."))
            vector_db.collection = vector_db.client.get_or_create_collection(
                name=vector_db.COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
            vector_db.products_collection = vector_db.client.get_or_create_collection(
                name=vector_db.PRODUCTS_COLLECTION_NAME
            )
            vector_db.documents_collection = vector_db.client.get_or_create_collection(
                name=vector_db.DOCUMENTS_COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
            self.stdout.write(self.style.SUCCESS("Collections re-initialized.\n"))


        self.stdout.write(self.style.HTTP_INFO("--- Starting VectorDB Re-indexing Process ---"))

        # Re-index Orders
        if run_all or options['orders']:
            self.stdout.write(self.style.HTTP_INFO("Indexing all orders..."))
            try:
                # We now call the function directly from the imported module
                count = vector_db.index_all_orders()
                self.stdout.write(self.style.SUCCESS(f"Successfully indexed {count} orders.\n"))
            except Exception as e:
                raise CommandError(f"Failed to index orders: {e}")

        # Re-index Products
        if run_all or options['products']:
            self.stdout.write(self.style.HTTP_INFO("Indexing all products..."))
            try:
                count = vector_db.index_all_products()
                self.stdout.write(self.style.SUCCESS(f"Successfully indexed {count} products.\n"))
            except Exception as e:
                raise CommandError(f"Failed to index products: {e}")

        # Re-index Policy Documents
        if run_all or options['documents']:
            self.stdout.write(self.style.HTTP_INFO("Indexing all policy documents..."))
            try:
                docs = PolicyDocument.objects.all()
                if not docs.exists():
                    self.stdout.write(self.style.NOTICE("No policy documents found to index."))
                else:
                    for doc in docs:
                        self.stdout.write(f"  - Indexing '{doc.title}'...")
                        vector_db.index_document(doc)
                    self.stdout.write(self.style.SUCCESS(f"Successfully indexed {docs.count()} policy documents.\n"))
            except Exception as e:
                raise CommandError(f"Failed to index policy documents: {e}")
        
        end_time = time.time()
        self.stdout.write(self.style.SUCCESS(f"--- Re-indexing complete in {end_time - start_time:.2f} seconds ---"))