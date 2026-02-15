import sys
import os

# Add backend to path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.insert(0, backend_dir)

print(f"Current Dir: {current_dir}")
print(f"Backend Dir: {backend_dir}")
print(f"Sys Path: {sys.path[0]}")

try:
    from app.core.config import settings
    print(f"Settings loaded. API Key: {settings.GROQ_API_KEY is not None}")
except Exception as e:
    print(f"Error loading settings: {e}")
    with open("backend/error.txt", "w", encoding="utf-8") as f:
        f.write(str(e))
    import traceback
    traceback.print_exc()

try:
    from app.services.ai_service import ai_service
    print("AIService imported.")
except Exception as e:
    print(f"Error loading AIService: {e}")
    import traceback
    traceback.print_exc()
