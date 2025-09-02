# api/moderation.py

from django.conf import settings
import google.generativeai as genai
import logging

# Configure the logger
logger = logging.getLogger(__name__)

# Configure the Gemini client
try:
    genai.configure(api_key=settings.GEMINI_API_KEY)
except AttributeError:
    logger.error("GEMINI_API_KEY not found in settings. Moderation will be disabled.")
    # This will prevent the app from crashing if the key is missing

def moderate_text_with_gemini(text: str) -> bool:
    """
    Uses the Gemini API to check if text is inappropriate.
    Returns True if flagged, False otherwise.
    """
    if not text.strip():
        return False # Empty text is not inappropriate

    # --- This is our carefully crafted prompt ---
    # It tells the model its role, gives it rules, and specifies the exact output format.
    prompt = f"""
    You are an AI content moderator for an e-commerce website. Your task is to determine if a product review is inappropriate.
    Inappropriate content includes: profanity, hate speech, harassment, threats, sexually explicit language, or spam.
    
    Analyze the following product review.
    
    Review: "{text}"
    
    Is this review inappropriate? Respond with a single word: YES or NO.
    """

    try:
        # Use the fast and cost-effective Flash model for this task
        model = genai.GenerativeModel('models/gemini-1.5-flash')
        
        # We can use slightly stricter safety settings here if desired
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        ]

        response = model.generate_content(prompt, safety_settings=safety_settings)

        # Check the model's direct text output
        model_response = response.text.strip().upper()
        
        # We check if the model's answer is "YES".
        if "YES" in model_response:
            logger.warning(f"Review flagged as inappropriate. Text: '{text[:100]}...'")
            return True
        
        return False

    except Exception as e:
        logger.error(f"An unexpected error occurred during Gemini moderation: {e}")
        # Fail-safe: to be cautious, we treat an API failure as a potential threat and block the content.
        return True