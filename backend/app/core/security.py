"""
Security utilities with JWT refresh tokens, password validation, and token management.
"""
from datetime import datetime, timedelta
from typing import Optional, Union, Any, Dict
from jose import jwt, JWTError
from passlib.context import CryptContext
import re
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"

# Token types
ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"


def create_access_token(
    subject: Union[str, Any], 
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create JWT access token with expiration.
    
    Args:
        subject: Token subject (user ID)
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": ACCESS_TOKEN_TYPE,
        "iat": datetime.utcnow()
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create JWT refresh token with longer expiration.
    
    Args:
        subject: Token subject (user ID)
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT refresh token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": REFRESH_TOKEN_TYPE,
        "iat": datetime.utcnow()
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload
        
    Raises:
        JWTError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        raise JWTError(f"Invalid token: {str(e)}")


def verify_token_type(payload: Dict[str, Any], expected_type: str) -> bool:
    """
    Verify token type matches expected type.
    
    Args:
        payload: Decoded token payload
        expected_type: Expected token type (access/refresh)
        
    Returns:
        True if type matches, False otherwise
    """
    return payload.get("type") == expected_type


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify plain password against hashed password.
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password from database
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """
    Validate password meets security requirements.
    
    Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    
    Args:
        password: Password to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    
    # Check for common weak passwords
    weak_passwords = [
        "password", "12345678", "qwerty", "abc123", "password123",
        "admin123", "letmein", "welcome", "monkey", "dragon"
    ]
    if password.lower() in weak_passwords:
        return False, "Password is too common. Please choose a stronger password"
    
    return True, None


def sanitize_input(input_string: str, max_length: int = 1000) -> str:
    """
    Sanitize user input to prevent XSS and injection attacks.
    
    Args:
        input_string: Input string to sanitize
        max_length: Maximum allowed length
        
    Returns:
        Sanitized string
    """
    if not input_string:
        return ""
    
    # Truncate to max length
    sanitized = input_string[:max_length]
    
    # Remove null bytes
    sanitized = sanitized.replace('\x00', '')
    
    # Remove control characters except newline and tab
    sanitized = ''.join(
        char for char in sanitized 
        if char == '\n' or char == '\t' or (ord(char) >= 32 and ord(char) != 127)
    )
    
    # Escape HTML special characters
    html_escape_table = {
        "&": "&amp;",
        '"': "&quot;",
        "'": "&#x27;",
        ">": "&gt;",
        "<": "&lt;",
    }
    sanitized = "".join(html_escape_table.get(c, c) for c in sanitized)
    
    return sanitized.strip()


def validate_email(email: str) -> bool:
    """
    Validate email format.
    
    Args:
        email: Email address to validate
        
    Returns:
        True if valid, False otherwise
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_filename(filename: str) -> tuple[bool, Optional[str]]:
    """
    Validate uploaded filename for security.
    
    Args:
        filename: Filename to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not filename:
        return False, "Filename cannot be empty"
    
    # Check for path traversal attempts
    if '..' in filename or '/' in filename or '\\' in filename:
        return False, "Invalid filename: path traversal detected"
    
    # Check for null bytes
    if '\x00' in filename:
        return False, "Invalid filename: null byte detected"
    
    # Check length
    if len(filename) > 255:
        return False, "Filename too long (max 255 characters)"
    
    # Check for valid characters
    if not re.match(r'^[a-zA-Z0-9._-]+$', filename):
        return False, "Filename contains invalid characters"
    
    return True, None


ALLOWED_UPLOAD_EXTENSIONS = {
    'pdf', 'doc', 'docx', 'txt', 'rtf',  # Documents
    'jpg', 'jpeg', 'png', 'gif',  # Images
}

ALLOWED_MIME_TYPES = {
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf',
    'image/jpeg',
    'image/png',
    'image/gif',
}

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB


def validate_file_upload(
    filename: str,
    content_type: str,
    file_size: int
) -> tuple[bool, Optional[str]]:
    """
    Validate file upload for security.
    
    Args:
        filename: Name of uploaded file
        content_type: MIME type of file
        file_size: Size of file in bytes
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Validate filename
    is_valid, error = validate_filename(filename)
    if not is_valid:
        return False, error
    
    # Check file extension
    extension = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if extension not in ALLOWED_UPLOAD_EXTENSIONS:
        return False, f"File type not allowed. Allowed types: {', '.join(ALLOWED_UPLOAD_EXTENSIONS)}"
    
    # Check MIME type
    if content_type not in ALLOWED_MIME_TYPES:
        return False, f"Invalid file type: {content_type}"
    
    # Check file size
    if file_size > MAX_UPLOAD_SIZE:
        return False, f"File too large. Maximum size: {MAX_UPLOAD_SIZE / 1024 / 1024}MB"
    
    if file_size == 0:
        return False, "File is empty"
    
    return True, None
