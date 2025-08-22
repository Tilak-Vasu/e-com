# backend/api/migrations/0002_seed_products.py

from django.db import migrations

# This is the list of your 30 products, translated into a Python list of dictionaries.
# I've removed the 'id' and 'image' fields as the database will handle the ID automatically.
PRODUCT_DATA = [
  # Category 1: Electronics
  { "name": "Quantum Smartphone", "category": "Electronics", "price": 699.99 },
  { "name": "Nova Laptop 15\"", "category": "Electronics", "price": 1299.00 },
  { "name": "Aura Wireless Headphones", "category": "Electronics", "price": 199.99 },
  { "name": "Streamer 4K Webcam", "category": "Electronics", "price": 89.50 },
  { "name": "Compact Gaming Mouse", "category": "Electronics", "price": 49.99 },
  # Category 2: Apparel
  { "name": "Classic Denim Jacket", "category": "Apparel", "price": 85.00 },
  { "name": "Urban Graphic T-Shirt", "category": "Apparel", "price": 24.99 },
  { "name": "Performance Joggers", "category": "Apparel", "price": 55.00 },
  { "name": "Everyday Crew Socks (3-Pack)", "category": "Apparel", "price": 15.00 },
  { "name": "Minimalist Canvas Sneakers", "category": "Apparel", "price": 75.00 },
  # Category 3: Books
  { "name": "The Art of Code", "category": "Books", "price": 32.99 },
  { "name": "Digital Minimalism", "category": "Books", "price": 18.00 },
  { "name": "A Brief History of Time", "category": "Books", "price": 15.99 },
  { "name": "The Design of Everyday Things", "category": "Books", "price": 20.50 },
  { "name": "Sapiens: A Brief History of Humankind", "category": "Books", "price": 22.00 },
  # Category 4: Home Goods
  { "name": "Aromatic Coffee Brewer", "category": "Home Goods", "price": 79.99 },
  { "name": "Ergonomic Desk Chair", "category": "Home Goods", "price": 250.00 },
  { "name": "Smart LED Desk Lamp", "category": "Home Goods", "price": 39.99 },
  { "name": "Bamboo Cutting Board Set", "category": "Home Goods", "price": 29.50 },
  { "name": "Plush Throw Blanket", "category": "Home Goods", "price": 45.00 },
  # Category 5: Sports & Outdoors
  { "name": "Insulated Water Bottle", "category": "Sports & Outdoors", "price": 25.00 },
  { "name": "Pro-Grip Yoga Mat", "category": "Sports & Outdoors", "price": 40.00 },
  { "name": "Adjustable Dumbbell Set", "category": "Sports & Outdoors", "price": 150.00 },
  { "name": "Compact Camping Tent", "category": "Sports & Outdoors", "price": 120.00 },
  { "name": "Trail-Ready Hiking Backpack", "category": "Sports & Outdoors", "price": 90.00 },
  # Category 6: Groceries
  { "name": "Organic Colombian Coffee Beans", "category": "Groceries", "price": 18.99 },
  { "name": "Artisanal Sourdough Bread", "category": "Groceries", "price": 6.50 },
  { "name": "Extra Virgin Olive Oil", "category": "Groceries", "price": 12.99 },
  { "name": "Gourmet Chocolate Bar", "category": "Groceries", "price": 4.99 },
  { "name": "Fresh Avocado (Set of 3)", "category": "Groceries", "price": 5.00 },
]

def seed_products(apps, schema_editor):
    Product = apps.get_model('api', 'Product')
    for product_data in PRODUCT_DATA:
        # The `get_or_create` method prevents creating duplicate products if you run the migration again.
        Product.objects.get_or_create(**product_data)

class Migration(migrations.Migration):

    dependencies = [
        # This should be the name of your PREVIOUS migration file (e.g., '0001_initial')
        ('api', '0001_initial'),
    ]

    operations = [
        # This tells Django to run our `seed_products` function.
        migrations.RunPython(seed_products),
    ]