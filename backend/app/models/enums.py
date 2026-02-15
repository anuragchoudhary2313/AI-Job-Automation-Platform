from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"

class JobStatus(str, Enum):
    PENDING = "pending"
    APPLIED = "applied"
    REJECTED = "rejected"
    INTERVIEWING = "interviewing"
    OFFERED = "offered"
    FAILED = "failed"
