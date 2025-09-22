#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Run database migrations
echo "Applying database migrations..."
python manage.py migrate

# Start the Daphne server.
# The 'exec' command is important, as it replaces the shell process with the Daphne process.
exec daphne -b 0.0.0.0 -p $PORT backend.asgi:application