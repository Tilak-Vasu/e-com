# api/vector_db.py

import chromadb
from sentence_transformers import SentenceTransformer
from .models import Order
import logging

logger = logging.getLogger(__name__)

# --- CONFIGURATION ---
CHROMA_PATH = "chroma_db"
COLLECTION_NAME = "orders"
EMBEDDING_MODEL_NAME = 'all-MiniLM-L6-v2' 

# --- Initialize ChromaDB Client and Sentence Transformer Model ---
try:
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )
    print("ChromaDB and Sentence Transformer model initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize ChromaDB or Sentence Transformer: {e}")
    collection = None
    embedding_model = None

def index_all_orders():
    """
    Fetches all orders from the database, creates a descriptive text for each,
    generates an embedding, and stores it in ChromaDB.
    """
    if not collection:
        raise Exception("ChromaDB collection is not available. Cannot index orders.")

    orders = Order.objects.prefetch_related('items', 'items__product').all()
    
    documents, metadatas, ids = [], [], []

    for order in orders:
        product_list = ", ".join([f"{item.quantity} x {item.product.name}" for item in order.items.all()])
        document_text = (
            f"Order ID {order.id} was placed on {order.created_at.strftime('%B %d, %Y')}. "
            f"It contained the products: {product_list}. "
            f"The total price was ${order.total_amount}."
        )
        documents.append(document_text)
        
        metadatas.append({
            "order_id": order.id,
            "user_id": order.user.id,
            "date": order.created_at.isoformat(),
            "total_amount": float(order.total_amount),
            "products": product_list
        })
        
        ids.append(str(order.id))

    if not documents:
        logger.info("No orders found to index.")
        return 0

    embeddings = embedding_model.encode(documents).tolist()

    # For a full re-index, it's safer to use upsert as well.
    collection.upsert(embeddings=embeddings, documents=documents, metadatas=metadatas, ids=ids)
    
    logger.info(f"Successfully indexed {len(documents)} orders into ChromaDB.")
    return len(documents)


def search_orders(query: str, user_id: int, n_results: int = 1):
    """
    Searches for the most relevant order for a given user query using RAG.
    """
    if not collection or not embedding_model:
        raise Exception("ChromaDB or embedding model not available. Cannot search.")

    query_embedding = embedding_model.encode(query).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        where={"user_id": user_id}
    )
    
    return results.get('metadatas', [[]])[0]

def index_single_order(order: Order):
    """
    Indexes or updates a single order in ChromaDB.
    """
    if not collection or not embedding_model:
        logger.error(f"ChromaDB not available. Cannot index order ID: {order.id}")
        return

    try:
        # This function might be called when order.items are not yet populated
        # The `transaction.on_commit` in the signal is what prevents this from failing
        product_list = ", ".join([f"{item.quantity} x {item.product.name}" for item in order.items.all()])
        document_text = (
            f"Order ID {order.id} was placed on {order.created_at.strftime('%B %d, %Y')}. "
            f"It contained: {product_list}. Total price was ${order.total_amount}."
        )
        
        metadata = {
            "order_id": order.id, "user_id": order.user.id,
            "date": order.created_at.isoformat(), "total_amount": float(order.total_amount),
            "products": product_list
        }
        
        embedding = embedding_model.encode(document_text).tolist()

        # --- THIS IS THE FIX ---
        # Use upsert() to handle both new orders and updates to existing orders.
        # This makes the real-time indexing much more robust.
        collection.upsert(
            embeddings=[embedding],
            documents=[document_text],
            metadatas=[metadata],
            ids=[str(order.id)]
        )
        logger.info(f"Successfully upserted order ID: {order.id}")
    except Exception as e:
        logger.error(f"Failed to upsert order ID {order.id}: {e}")