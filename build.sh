#!/bin/bash

# This script tells Vercel how to build your project.

# Step 1: Build the frontend
echo "Building frontend..."
# Navigate into the frontend directory, install dependencies, and run the build command
cd frontend
npm install
npm run build
# Go back to the root directory
cd ..

# Step 2: Prepare the backend
echo "Running Django migrations..."
# Run the migrate command, pointing to the correct manage.py file
python backend/manage.py migrate --noinput