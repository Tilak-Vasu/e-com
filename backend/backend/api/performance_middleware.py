# backend/backend/api/performance_middleware.py
import time
import threading
import datetime
from .models import PerformanceMetric  # Import the new model

class PerformanceMonitoringMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        response = self.get_response(request)

        response_time_ms = (time.time() - start_time) * 1000

        # Only log metrics for paths that start with /api/ to avoid logging admin pages, etc.
        if request.path.startswith('/api/'):
            metrics = {
                'request_type': request.method,
                'url_endpoint': request.path,
                'response_time_ms': round(response_time_ms, 2),
                'status_code': response.status_code,
                # We don't need to add the timestamp here, the model does it automatically
                'user_agent': request.headers.get('User-Agent', 'Unknown')
            }

            # Save the metric to the database in a background thread to avoid
            # slowing down the response to the user.
            thread = threading.Thread(target=self.save_metric, args=(metrics,))
            thread.daemon = True
            thread.start()

        return response

    def save_metric(self, metrics):
        """
        Saves a dictionary of metrics to the PerformanceMetric table.
        """
        try:
            PerformanceMetric.objects.create(**metrics)
        except Exception as e:
            # For production, you would want to log this error properly
            print(f"Error saving performance metric to database: {e}")
            