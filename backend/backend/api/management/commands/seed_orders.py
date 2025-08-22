# api/management/commands/seed_orders.py

import random
from datetime import timedelta
from django.core.management.base import BaseCommand  # <-- Make sure this is imported
from django.utils import timezone
from api.models import Product, Order, OrderItem, User

# --- THIS IS THE CRUCIAL PART ---
# The entire logic must be inside this class definition.
class Command(BaseCommand):
    help = 'Seeds the database with fake historical orders.'

    # The main logic must be inside a method called 'handle'.
    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting to seed historical orders...'))

        # Ensure we have users and products to work with
        users = list(User.objects.all())
        products = list(Product.objects.all())
        if not users or not products:
            self.stdout.write(self.style.ERROR('Please create some users and products first before seeding.'))
            return

        # Clear existing orders to start fresh
        Order.objects.all().delete()
        self.stdout.write('Deleted all existing orders.')
        
        now = timezone.now()
        
        # Create orders over the last 12 months
        for i in range(365): # Create data for roughly a year
            # Randomly decide whether to create orders on a given day
            if random.random() > 0.7: # ~30% chance of having orders on any given day
                # Create a random number of orders for that day
                for _ in range(random.randint(1, 5)):
                    # Pick a random user
                    customer = random.choice(users)
                    
                    # Create the order object with a past date
                    order_date = now - timedelta(days=i)
                    order = Order.objects.create(
                        user=customer,
                        total_amount=0, # Will update this after adding items
                        payment_method=random.choice(['Credit Card', 'Pay on Delivery']),
                        shipping_info={"name": customer.username, "address": "123 Fake St"}
                    )
                    # Manually set the creation date because auto_now_add is tricky
                    Order.objects.filter(id=order.id).update(created_at=order_date)

                    order_total = 0
                    # Add a random number of items to the order
                    for __ in range(random.randint(1, 3)):
                        product = random.choice(products)
                        quantity = random.randint(1, 2)
                        price = product.price
                        
                        OrderItem.objects.create(
                            order=order,
                            product=product,
                            quantity=quantity,
                            price=price
                        )
                        order_total += price * quantity
                    
                    # Update the order total
                    order.total_amount = order_total
                    order.save(update_fields=['total_amount'])

        self.stdout.write(self.style.SUCCESS('Successfully seeded the database with historical orders.'))