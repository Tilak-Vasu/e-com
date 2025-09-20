# api/management/commands/check_metrics.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import PerformanceMetric

class Command(BaseCommand):
    help = 'Checks for recent API errors and high latency in performance metrics.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting metric check...")

        # Define the time window to check (e.g., the last 5 minutes)
        five_minutes_ago = timezone.now() - timedelta(minutes=5)

        # --- Check for Server Errors (5xx status codes) ---
        error_metrics = PerformanceMetric.objects.filter(
            status_code__gte=500,
            timestamp__gte=five_minutes_ago
        )

        error_count = error_metrics.count()
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f"ALERT: Found {error_count} server error(s) in the last 5 minutes."))
            # In a real system, you would add your email/Slack sending logic here.
            # For example: send_alert_email(f"Found {error_count} errors.")

        # --- Check for High Latency ---
        high_latency_metrics = PerformanceMetric.objects.filter(
            response_time_ms__gt=2000,  # Alert if response time is over 2000ms (2 seconds)
            timestamp__gte=five_minutes_ago
        )

        latency_count = high_latency_metrics.count()
        if latency_count > 0:
            self.stdout.write(self.style.WARNING(f"ALERT: Found {latency_count} high-latency request(s) in the last 5 minutes."))
            # Here you could send a different type of alert

        self.stdout.write(self.style.SUCCESS("Metric check complete."))