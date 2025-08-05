# backend/backend/wsgi.py

import os
import sys
from pathlib import Path
from django.core.wsgi import get_wsgi_application

# This adds your project to the Python path to solve the 'backend.settings' error
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# --- THIS IS THE KEY FIX ---
# We are renaming the variable from 'application' to 'app'
# so that Vercel's Python runtime can find it.
app = get_wsgi_application()