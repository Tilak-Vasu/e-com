# api/moderation.py

from django.conf import settings
# --- THE FIX: Import the LangChain LLM class ---
from langchain_google_genai import ChatGoogleGenerativeAI
import logging

logger = logging.getLogger(__name__)

def moderate_text_with_gemini(text: str) -> bool:
    if not text.strip():
        return False


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
        # --- THE FIX: Use the LangChain syntax ---
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            temperature=0, # Low temperature for factual classification
            google_api_key=settings.GEMINI_API_KEY
        )
        response = llm.invoke(prompt) # Use .invoke()
        
        # The response from LangChain is in the .content attribute
        model_response = response.content.strip().upper()
        
        if "YES" in model_response:
            logger.warning(f"Review flagged as inappropriate. Text: '{text[:100]}...'")
            return True
        
        return False
    except Exception as e:
        logger.error(f"An unexpected error occurred during Gemini moderation: {e}")
        return True