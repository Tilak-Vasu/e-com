# backend/backend/wsgi.py

import os
import sys
from pathlib import Path # <-- Add this import
from django.core.wsgi import get_wsgi_application

# --- ADD THESE THREE LINES ---
# This ensures the Vercel runtime can also find your settings module.
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR))
# --- END OF ADDITION ---

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# The variable must be named 'app' for Vercel
app = get_wsgi_application()