# api/vector_db.py

import chromadb
from sentence_transformers import SentenceTransformer
from .models import Order, PolicyDocument, Product
import logging
from pypdf import PdfReader
import io

logger = logging.getLogger(__name__)

# --- CONFIGURATION ---
CHROMA_PATH = "chroma_db"
COLLECTION_NAME = "orders"
EMBEDDING_MODEL_NAME = 'all-MiniLM-L6-v2' 
DOCUMENTS_COLLECTION_NAME = "documents"
PRODUCTS_COLLECTION_NAME = "products"

# --- Initialize ChromaDB Client and Sentence Transformer Model ---
try:
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )
    documents_collection = client.get_or_create_collection(
        name=DOCUMENTS_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )
    products_collection = client.get_or_create_collection(name=PRODUCTS_COLLECTION_NAME)
    print("ChromaDB and Sentence Transformer model initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize ChromaDB or Sentence Transformer: {e}")
    collection = None
    embedding_model = None
    documents_collection = None
    products_collection = None


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
        
        # --- FIX: Convert ALL metadata values to strings to ensure they are saved ---
        metadatas.append({
            "order_id": str(order.id),
            "user_id": str(order.user.id),
            "date": order.created_at.isoformat(),
            "total_amount": str(int(order.total_amount * 100)), # Store cents as a string
            "products": product_list
        })
        
        ids.append(str(order.id))

    if not documents:
        logger.info("No orders found to index.")
        return 0
    
    collection.upsert(embeddings=embedding_model.encode(documents).tolist(), documents=documents, metadatas=metadatas, ids=ids)
    logger.info(f"Successfully indexed {len(documents)} orders into ChromaDB.")
    return len(documents)


def search_orders(query: str, user_id: int, n_results: int = 1):
    """
    Searches for the most relevant order for a given user query using RAG.
    """
    if not collection or not embedding_model:
        raise Exception("ChromaDB or embedding model not available. Cannot search.")

    query_embedding = embedding_model.encode(query).tolist()
    
    # --- FIX: The value in the 'where' filter must also be a string to match storage format ---
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        where={"user_id": str(user_id)}
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
        product_list = ", ".join([f"{item.quantity} x {item.product.name}" for item in order.items.all()])
        document_text = (
            f"Order ID {order.id} was placed on {order.created_at.strftime('%B %d, %Y')}. "
            f"It contained: {product_list}. Total price was ${order.total_amount}."
        )
        
        # --- FIX: Convert ALL metadata values to strings to ensure they are saved ---
        metadata = {
            "order_id": str(order.id), 
            "user_id": str(order.user.id),
            "date": order.created_at.isoformat(), 
            "total_amount": str(int(order.total_amount * 100)),
            "products": product_list
        }
        
        embedding = embedding_model.encode(document_text).tolist()
        collection.upsert(
            embeddings=[embedding],
            documents=[document_text],
            metadatas=[metadata],
            ids=[str(order.id)]
        )
        logger.info(f"Successfully upserted order ID: {order.id}")
    except Exception as e:
        logger.error(f"Failed to upsert order ID {order.id}: {e}")


def index_all_products():
    """
    Fetches all products from the database, creates a rich text document for each,
    generates an embedding, and stores it in the 'products' collection.
    """
    if not products_collection:
        raise Exception("ChromaDB 'products' collection is not available.")

    all_products = Product.objects.all()
    documents, metadatas, ids = [], [], []

    for product in all_products:
        document_text = (
            f"Product Name: {product.name}. Category: {product.category}. Price: ${product.price}. "
            f"Description: {product.description or 'N/A'}."
        )
        documents.append(document_text)
        
        # --- FIX: Convert ALL metadata values to strings ---
        metadatas.append({
            "product_id": str(product.id),
            "name": product.name,
            "category": product.category,
            "price": str(int(product.price * 100)) # Store cents as a string
        })
        
        ids.append(str(product.id))

    if not documents:
        return 0

    products_collection.upsert(ids=ids, embeddings=embedding_model.encode(documents).tolist(), documents=documents, metadatas=metadatas)
    logger.info(f"Successfully indexed {len(documents)} products.")
    return len(documents)


def index_single_product(product: Product):
    """
    Indexes or updates a single product in the 'products' collection.
    """
    if not products_collection or not embedding_model:
        return

    try:
        document_text = (
            f"Product Name: {product.name}. Category: {product.category}. Price: ${product.price}. "
            f"Description: {product.description or 'N/A'}."
        )
        # --- FIX: Convert ALL metadata values to strings ---
        metadata = {
            "product_id": str(product.id), 
            "name": product.name,
            "category": product.category, 
            "price": str(int(product.price * 100))
        }
        embedding = embedding_model.encode(document_text).tolist()
        products_collection.upsert(ids=[str(product.id)], embeddings=[embedding], documents=[document_text], metadatas=[metadata])
        logger.info(f"Successfully indexed/updated product ID: {product.id}")
    except Exception as e:
        logger.error(f"Failed to index/update product ID {product.id}: {e}")


# --- UNCHANGED FUNCTIONS BELOW ---

def extract_text_from_file(file_field):
    """Extracts text from an uploaded file (PDF or TXT)."""
    file_bytes = file_field.read()
    file_stream = io.BytesIO(file_bytes)
    if file_field.name.lower().endswith('.pdf'):
        reader = PdfReader(file_stream)
        return "".join(page.extract_text() for page in reader.pages)
    elif file_field.name.lower().endswith('.txt'):
        return file_stream.read().decode('utf-8')
    else:
        logger.warning(f"Unsupported file type for text extraction: {file_field.name}")
        return ""


def index_document(document: PolicyDocument):
    """
    Reads a PolicyDocument, splits its text into chunks, creates embeddings,
    and adds them to the 'documents' collection in ChromaDB.
    """
    if not documents_collection or not embedding_model:
        raise Exception("ChromaDB document collection not available.")
    text = extract_text_from_file(document.file)
    if not text:
        logger.warning(f"No text extracted from document ID {document.id}. Skipping indexing.")
        return
    chunks = [text[i:i+500] for i in range(0, len(text), 400)]
    if not chunks:
        return
    chunk_ids = [f"doc{document.id}_chunk{i}" for i, _ in enumerate(chunks)]
    metadatas = [{"document_id": document.id, "document_title": document.title, "chunk_index": i} for i, _ in enumerate(chunks)]
    documents_collection.upsert(ids=chunk_ids, embeddings=embedding_model.encode(chunks).tolist(), documents=chunks, metadatas=metadatas)
    logger.info(f"Successfully indexed/updated {len(chunks)} chunks for document: {document.title}")

def delete_document_from_index(document_id: int):
    """Deletes all chunks associated with a document ID from ChromaDB."""
    if not documents_collection:
        return
    documents_collection.delete(where={"document_id": document_id})
    logger.info(f"Successfully deleted chunks for document ID: {document_id}")


def search_documents(query: str, n_results: int = 3):
    """Searches the 'documents' collection for the most relevant text chunks."""
    if not documents_collection or not embedding_model:
        return []
    query_embedding = embedding_model.encode(query).tolist()
    results = documents_collection.query(query_embeddings=[query_embedding], n_results=n_results)
    return results.get('documents', [[]])[0]

def delete_product_from_index(product_id: int):
    """Deletes a product from the 'products' collection by its ID."""
    if not products_collection:
        return
    products_collection.delete(ids=[str(product_id)])
    logger.info(f"Successfully deleted product ID: {product_id} from index.")


def search_products(query: str, n_results: int = 3):
    """
    Performs a semantic search on the 'products' collection.
    Returns the full text document of the most relevant products.
    """
    if not products_collection or not embedding_model:
        return []
    query_embedding = embedding_model.encode(query).tolist()
    results = products_collection.query(query_embeddings=[query_embedding], n_results=n_results)
    return results.get('documents', [[]])[0]