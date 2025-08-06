# backend/backend/wsgi.py

import os
import sys
from pathlib import Path
from django.core.wsgi import get_wsgi_application

# This line fixes the Python Path issue for both local and production
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# --- THIS IS THE KEY FIX ---

# The local `runserver` command looks for a variable named 'application'.
application = get_wsgi_application()

# The Vercel deployment environment looks for a variable named 'app'.
# We will create 'app' and point it to the same object as 'application'.
app = application