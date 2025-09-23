#!/bin/sh
set -e
echo "Container started successfully"
echo "PORT is: $PORT"
echo "Working directory: $(pwd)"
echo "Files in directory: $(ls -la)"
python manage.py migrate
exec daphne -b 0.0.0.0 -p 8000 backend.asgi:application