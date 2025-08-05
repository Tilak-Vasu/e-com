#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Run migrations for the Django app
echo "Running migrations..."
python backend/manage.py migrate --noinput