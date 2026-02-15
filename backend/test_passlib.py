from passlib.context import CryptContext
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    print("Context created")
    hash = pwd_context.hash("Password123!")
    print(f"Hash success: {hash}")
except Exception as e:
    print(f"Error: {e!r}")
