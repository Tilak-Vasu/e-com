# backend/backend/wsgi.py

import os
import sys
from pathlib import Path # <-- Add this import
from django.core.wsgi import get_wsgi_application

# --- ADD THESE THREE LINES ---
# This tells the Vercel environment where to find your project's root folder.
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR))
# --- END OF ADDITION ---

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = get_wsgi_application()