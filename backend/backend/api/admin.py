from django.contrib import admin
from .models import Product, LikedProduct, Order, OrderItem,PerformanceMetric

admin.site.register(Product)
admin.site.register(LikedProduct)
admin.site.register(Order)
admin.site.register(OrderItem)

@admin.register(PerformanceMetric)
class PerformanceMetricAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'url_endpoint', 'status_code', 'response_time_ms', 'request_type')
    list_filter = ('status_code', 'request_type')
    search_fields = ('url_endpoint',)
    date_hierarchy = 'timestamp'