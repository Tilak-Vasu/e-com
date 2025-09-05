# api/models.py

from django.db import models
from django.contrib.auth.models import User

class Product(models.Model):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    stock_quantity = models.IntegerField(default=0)
    
    # Support both URL and file upload for images
    image_url = models.URLField(max_length=500, blank=True, null=True, help_text="URL to product image")
    image_file = models.ImageField(upload_to='products/', blank=True, null=True, help_text="Upload product image file")
    
    # AI fields
    seo_keywords = models.CharField(max_length=255, blank=True, null=True, help_text="AI-generated comma-separated SEO keywords")
    ai_tags = models.TextField(blank=True, null=True, help_text="AI-generated comma-separated tags for smart searching")
    
    def __str__(self):
        return self.name
    
    @property
    def image(self):
        """Returns the appropriate image URL - prioritizes uploaded file over URL"""
        if self.image_file:
            return self.image_file.url
        return self.image_url

class LikedProduct(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='liked_products')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f'{self.user.username} likes {self.product.name}'

class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    created_at = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_info = models.JSONField()
    payment_method = models.CharField(max_length=50)

    def __str__(self):
        return f"Order {self.id} by {self.user.username}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} of {self.product.name}"
    


class ChatThread(models.Model):
    # A thread can have multiple participants (the customer and all staff members)
    participants = models.ManyToManyField(User, related_name='chat_threads')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        # Generate a descriptive name for the thread in the admin panel
        users = self.participants.all()
        return f"Thread between {', '.join([user.username for user in users])}"

class ChatMessage(models.Model):
    thread = models.ForeignKey(ChatThread, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"Message from {self.sender.username} at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
    

class ProductReview(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # A user can only write one review per product
        ordering = ['-created_at']

    def __str__(self):
        return f'Review for {self.product.name} by {self.author.username}'
    

class UserCart(models.Model):
    """
    Represents the persistent shopping cart for an authenticated user.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='cart',
        verbose_name='User'
    )
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart for {self.user.username}"

class CartItem(models.Model):
    """
    Represents an item within a persistent UserCart.
    """
    cart = models.ForeignKey(
        UserCart,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Cart'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        verbose_name='Product'
    )
    # We must store quantity, price, and stock here to save the state
    quantity = models.IntegerField(default=1)
    
    # Store the product price and stock quantity at the time the item was added/updated
    # This is critical for cart persistence and stock checking
    price_at_addition = models.DecimalField(max_digits=10, decimal_places=2)
    stock_at_update = models.IntegerField()

    class Meta:
        # Ensures a user doesn't have multiple entries for the same product in their cart
        unique_together = ('cart', 'product')

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in {self.cart.user.username}'s cart"




class PolicyDocument(models.Model):
    """
    Represents an uploaded policy document (e.g., Returns, Shipping)
    that can be used as a knowledge base for the RAG chatbot.
    """
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='policy_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title