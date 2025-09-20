#!/bin/bash

# This script prepares the Django application for deployment on Vercel.

# Exit immediately if a command fails.
set -e

echo "Build script started."

# Install Python dependencies from your requirements file.
# Note the path is relative to the project root.
echo "Installing Python packages..."
pip install -r backend/backend/requirements.txt

# Navigate to the correct directory to run manage.py.
cd backend/backend

# Collect static files for the Django Admin interface.
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Apply database migrations to your production database.
echo "Applying database migrations..."
python manage.py migrate

echo "Build script finished."