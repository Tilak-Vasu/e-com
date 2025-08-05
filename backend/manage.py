#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
from pathlib import Path # <-- Make sure this is imported

def main():
    """Run administrative tasks."""

    # --- ADD THESE THREE LINES ---
    # This manually adds your project's root 'backend' folder to the
    # list of places Python looks for code. This is the fix.
    ROOT_DIR = Path(__file__).resolve().parent
    sys.path.append(str(ROOT_DIR.parent))
    # --- END OF ADDITION ---

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()