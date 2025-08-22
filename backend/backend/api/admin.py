from django.contrib import admin
from .models import Product, LikedProduct, Order, OrderItem

admin.site.register(Product)
admin.site.register(LikedProduct)
admin.site.register(Order)
admin.site.register(OrderItem)