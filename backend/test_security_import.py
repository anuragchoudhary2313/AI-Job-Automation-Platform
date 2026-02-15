import sys
import os
sys.path.append("c:/Users/anura/ai-job-automation-saas/backend")
from app.core import security

try:
    print(f"Testing security.get_password_hash with 'Password123!'")
    hash = security.get_password_hash("Password123!")
    print(f"Success: {hash}")
except Exception as e:
    print(f"Error: {e!r}")
