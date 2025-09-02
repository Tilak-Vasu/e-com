# api/apps.py

from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    # --- THIS IS THE CRUCIAL PART ---
    # This method is called when the Django app is ready.
    # Importing the signals here ensures they are connected.
    def ready(self):
        import api.signals