# api/chatbot_tools.py

from langchain.tools import tool
from django.db.models import Sum, Count
from django.utils import timezone
import datetime
import json
import re
from asgiref.sync import sync_to_async

from .models import Order, OrderItem, Product
from .vector_db import search_products, search_documents

from langchain_google_genai import ChatGoogleGenerativeAI  # Updated import

async def parse_date_query_with_ai(query: str) -> dict:
    """
    Uses a fast, non-blocking LLM call to parse a natural language query 
    and extract a start and end date.
    """
    @sync_to_async
    def get_today():
        return timezone.now().date()

    today = await get_today()
    
    prompt = f"""
    You are a date parsing expert. Analyze the user's query and determine the start and end date for their request.
    The current date is {today.strftime('%B %d, %Y')}.
    Respond with ONLY a valid JSON object with two keys: "start_date" and "end_date", in "YYYY-MM-DD" format.
    - If a specific year is mentioned (e.g., "in 2024"), use the whole year.
    - If it's "today", use today's date for both.
    - If it's "this week", start from the most recent Monday.
    - If it's "last month", use the previous calendar month.
    - If no period is mentioned, default to the previous full calendar month.
    User Query: "{query}"
    """
    try:
        model = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
        response = await model.ainvoke(prompt)
        json_string = response.content.strip().replace("```json", "").replace("```", "")
        dates = json.loads(json_string)
        return {
            "start_date": datetime.datetime.strptime(dates["start_date"], "%Y-%m-%d").date(),
            "end_date": datetime.datetime.strptime(dates["end_date"], "%Y-%m-%d").date()
        }
    except Exception:
        end_date = today.replace(day=1) - datetime.timedelta(days=1)
        start_date = end_date.replace(day=1)
        return {"start_date": start_date, "end_date": end_date}


# --- SPECIALIZED ASYNC TOOLS ---

# <--- TOOL 1: REFOCUSED ON ANALYTICS ONLY ---
@tool
async def get_order_information(query: str) -> str:
    """
    TOOL 1: The Analytics Engine.
    Use for questions about sales, revenue, totals, business performance, or best-sellers.
    This tool performs calculations and aggregations. Do NOT use it to list individual orders.
    """
    print(f"--- Tool: get_order_information called with query: {query} ---")

    @sync_to_async
    def _get_order_data_sync(start_date, end_date):
        query_lower = query.lower()
        
        order_id_match = re.search(r'(order #|order id)\s*(\d+)', query_lower)
        if order_id_match:
            order_id = int(order_id_match.group(2))
            try:
                order = Order.objects.prefetch_related('items', 'items__product').get(id=order_id)
                product_list = ", ".join([f"{item.quantity} x {item.product.name}" for item in order.items.all()])
                return f"Found Order #{order.id} for user '{order.user.username}': Placed on {order.created_at.strftime('%B %d, %Y')}, Total: ${order.total_amount}, Items: {product_list}."
            except Order.DoesNotExist:
                return f"Could not find an order with the ID #{order_id}."

        period_str = f"between {start_date.strftime('%b %d, %Y')} and {end_date.strftime('%b %d, %Y')}"

        if any(keyword in query_lower for keyword in ["best-selling", "bestseller", "top seller", "most popular"]):
            sales_data = OrderItem.objects.filter(order__created_at__date__range=(start_date, end_date)).values('product__name', 'product__price').annotate(total_sold=Sum('quantity')).order_by('-total_sold')[:5]
            if not sales_data: return f"No sales data was found for the period {period_str}."
            result = f"Top-selling products {period_str}:\n"
            for i, item in enumerate(sales_data, 1):
                result += f"{i}. {item['product__name']} - {item['total_sold']} units sold (${item['product__price']} each)\n"
            return result.strip()
        
        else:
            orders_in_period = Order.objects.filter(created_at__date__range=(start_date, end_date))
            aggregation = orders_in_period.aggregate(total_revenue=Sum('total_amount'), total_orders=Count('id'))
            revenue = aggregation.get('total_revenue') or 0
            count = aggregation.get('total_orders') or 0
            avg_order_value = revenue / count if count > 0 else 0
            return f"Here is a summary of business performance for {period_str}:\n• Total Orders: {count}\n• Total Revenue: ${revenue:,.2f}\n• Average Order Value: ${avg_order_value:.2f}"

    date_range = await parse_date_query_with_ai(query)
    return await _get_order_data_sync(date_range["start_date"], date_range["end_date"])


# <--- TOOL 2: NEW TOOL DEDICATED TO LISTING ORDERS ---
@tool
async def get_order_history(query: str) -> str:
    """
    TOOL 2: The Order History Finder.
    Use this tool ONLY when the user asks to see or list individual orders, recent orders,
    or a history of orders. It retrieves a list of specific orders within a date range.
    Do NOT use this for calculating totals or revenue.
    """
    print(f"--- Tool: get_order_history called with query: {query} ---")

    @sync_to_async
    def _get_history_data_sync(start_date, end_date):
        period_str = f"between {start_date.strftime('%b %d, %Y')} and {end_date.strftime('%b %d, %Y')}"
        
        recent_orders = Order.objects.filter(
            created_at__date__range=(start_date, end_date)
        ).prefetch_related('user', 'items', 'items__product').order_by('-created_at')[:25]

        if not recent_orders.exists():
            return f"No individual orders were found for the period {period_str}."

        result_str = f"Here are the most recent orders {period_str}:\n\n"
        order_items_in_period = OrderItem.objects.filter(order__in=recent_orders).select_related('product', 'order__user').order_by('-order__created_at')
            
        for item in order_items_in_period:
            result_str += f"• {item.product.name} (ordered by {item.order.user.username})\n"

        return result_str.strip()

    date_range = await parse_date_query_with_ai(query)
    return await _get_history_data_sync(date_range["start_date"], date_range["end_date"])


# --- NO CHANGES TO THE REMAINING TOOLS ---

@tool
async def check_inventory_status(query: str) -> str:
    """
    TOOL 3: The Inventory Checker.
    Use ONLY for questions about product stock levels (out of stock, low stock).
    """
    # ... (code for this tool is unchanged)
    print(f"--- Tool: check_inventory_status called with query: {query} ---")
    @sync_to_async
    def _get_inventory_data_sync():
        out_of_stock = Product.objects.filter(stock_quantity=0)
        low_stock = Product.objects.filter(stock_quantity__gt=0, stock_quantity__lte=10)
        result = ""
        if out_of_stock.exists():
            result += "Out of Stock Products:\n" + "\n".join([f"• {p.name} - ${p.price}" for p in out_of_stock[:15]]) + "\n"
        if low_stock.exists():
            result += "\nLow Stock Products (≤10 units):\n" + "\n".join([f"• {p.name} - {p.stock_quantity} left" for p in low_stock[:15]])
        return result.strip() if result else "All products are well-stocked (>10 units available)."
    return await _get_inventory_data_sync()


@tool
async def get_product_information(query: str) -> str:
    """
    TOOL 4: The Catalog Search.
    Use for general, descriptive searches for products. Does NOT know about sales or stock levels.
    """
    # ... (code for this tool is unchanged)
    print(f"--- Tool: get_product_information called with query: {query} ---")
    @sync_to_async
    def _get_product_search_sync():
        product_results = search_products(query, n_results=5)
        if not product_results: return "No products matching that description were found in the catalog."
        return "\n---\n".join(product_results)
    return await _get_product_search_sync()


@tool
async def get_policy_information(query: str) -> str:
    """
    TOOL 5: The Document Finder.
    Use for questions about company policies (returns, shipping, etc.).
    """
    # ... (code for this tool is unchanged)
    print(f"--- Tool: get_policy_information called with query: {query} ---")
    @sync_to_async
    def _get_policy_data_sync():
        document_results = search_documents(query, n_results=3)
        if not document_results: return "No information about that policy was found in our documents."
        return "\n---\n".join(document_results)
    return await _get_policy_data_sync()