# check_models.py

import os
import django

# --- This part is crucial to load your Django settings ---
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
# --- End of Django setup ---

from django.conf import settings
import google.generativeai as genai

print("--- Checking available Gemini Models ---")

try:
    # Configure the client with your API key from settings
    genai.configure(api_key=settings.GEMINI_API_KEY)
    
    print("Successfully configured with API key.")
    print("Fetching model list...")
    
    # List all models that support the 'generateContent' method
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"Model found: {m.name}")

except Exception as e:
    print(f"\nAn error occurred: {e}")
    print("\nPlease double-check that your GEMINI_API_KEY in the .env file is correct and has been renewed recently.")

print("\n--- Check complete ---")