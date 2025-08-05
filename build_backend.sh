#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "--- Installing Python Dependencies ---"
pip install -r requirements.txt

echo "--- Running Django Database Migrations ---"
# This command tells Django to create all the tables in your new Postgres database.
python backend/manage.py migrate --noinput