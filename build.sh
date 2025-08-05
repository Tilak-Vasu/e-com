#!/bin/bash

# This script tells Vercel how to build your entire project.

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Build the Frontend First ---
echo "STEP 1: Building the frontend..."
# Navigate into the frontend directory
cd frontend
# Install dependencies and run the production build
npm install
npm run build
# Navigate back to the project root
cd ..

# --- Prepare the Backend Second ---
echo "STEP 2: Installing Python dependencies..."
# Install all packages from your requirements.txt file
pip install -r requirements.txt

echo "STEP 3: Running Django database migrations..."
# This is the most crucial command. It will connect to your Postgres DB
# and create all the necessary tables like "auth_user".
python backend/manage.py migrate --noinput