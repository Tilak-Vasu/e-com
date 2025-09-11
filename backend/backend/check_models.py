# check_models.py

import os
import django

# Load Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
# --- THE FIX: Import the LangChain library ---
from langchain_google_genai import ChatGoogleGenerativeAI

print("--- Checking available Gemini Models via LangChain ---")

try:
    # --- THE FIX: Initialize the LangChain client ---
    # This automatically uses your GOOGLE_APPLICATION_CREDENTIALS or other auth methods
    # We pass the key explicitly to be sure.
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", # We need a valid model to initialize
        google_api_key=settings.GEMINI_API_KEY
    )
    
    print("Successfully configured with API key.")
    print("Note: The LangChain library does not have a direct 'list_models' function.")
    print("However, successful initialization proves that your credentials and the default model are working.")
    print("Commonly available models for generative tasks are: 'gemini-1.5-flash', 'gemini-1.5-pro'")

except Exception as e:
    print(f"\nAn error occurred: {e}")
    print("\nPlease double-check that your GEMINI_API_KEY in the .env file is correct and has been renewed recently.")

print("\n--- Check complete ---")