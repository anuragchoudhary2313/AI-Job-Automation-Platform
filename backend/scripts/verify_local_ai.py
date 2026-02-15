import sys
import os
import logging
from unittest.mock import MagicMock, patch

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(backend_dir)

# Verify imports work
try:
    from app.services.ai.local_llm import LocalLLMService
    from app.core.config import settings
    print("Imports successful.")
except ImportError as e:
    print(f"Import failed: {e}")
    sys.exit(1)

# Mock settings
settings.OLLAMA_BASE_URL = "http://localhost:11434"
settings.OLLAMA_DEFAULT_MODEL = "llama3"
settings.OLLAMA_FALLBACK_MODEL = "mistral"
settings.LOCAL_MODEL_LIGHT = "phi-3"

def test_local_llm_logic():
    print("Testing LocalLLMService logic...")
    
    with patch("app.services.ai.local_llm.requests.post") as mock_post:
        # Test 1: Primary Model Success
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"response": "Success from Llama3"}
        
        service = LocalLLMService()
        result = service._generate("test prompt")
        
        if result == "Success from Llama3":
            print("✅ Primary model test passed.")
        else:
            print(f"❌ Primary model test failed. Got: {result}")
            return False

        # Verify model used
        args, kwargs = mock_post.call_args
        if kwargs["json"]["model"] == "llama3":
            print("✅ Correct model (llama3) used.")
        else:
            print(f"❌ Wrong model used: {kwargs['json']['model']}")
            return False

        # Test 2: Fallback Logic
        mock_post.side_effect = [
            MagicMock(status_code=500), # Primary fails
            MagicMock(status_code=200, json=lambda: {"response": "Success from Mistral"})
        ]
        
        result = service._generate("test prompt")
        if result == "Success from Mistral":
            print("✅ Fallback logic test passed.")
        else:
            print(f"❌ Fallback logic test failed. Got: {result}")
            return False
            
    print("All logic tests passed.")
    return True

if __name__ == "__main__":
    success = test_local_llm_logic()
    if not success:
        sys.exit(1)
