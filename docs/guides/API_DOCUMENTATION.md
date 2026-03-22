# API Documentation

## Overview

The AI Job Automation SaaS API is a RESTful API built with FastAPI. It follows a professional layered architecture with routes, services, and repositories.

**Base URL:** `http://localhost:8000/api/v1`

**Authentication:** Bearer token (JWT)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        API Routes                            │
│  (FastAPI endpoints - thin layer, validation only)          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  (Business logic, authorization, orchestration)             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Repository Layer                          │
│  (Data access, queries, CRUD operations)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database (PostgreSQL)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Authentication

### POST /auth/login

Authenticate user and receive access tokens.

**Request:**
```json
{
  "username": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Status Codes:**
- `200 OK` - Authentication successful
- `401 Unauthorized` - Invalid credentials
- `422 Unprocessable Entity` - Validation error

---

### POST /auth/register

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePassword123",
  "full_name": "John Doe",
  "team_id": 1
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "role": "member",
  "team_id": 1,
  "created_at": "2026-02-07T01:00:00Z"
}
```

**Status Codes:**
- `201 Created` - User created successfully
- `409 Conflict` - Email or username already exists
- `422 Unprocessable Entity` - Validation error

---

### POST /auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

### GET /auth/me

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "role": "member",
  "team_id": 1,
  "created_at": "2026-02-07T01:00:00Z"
}
```

---

### POST /auth/change-password

Change user password.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "current_password": "OldPassword123",
  "new_password": "NewPassword456"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

---

## Jobs

### GET /jobs/

List all jobs for the user's team.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `skip` (int, default: 0) - Number of records to skip
- `limit` (int, default: 100) - Maximum number of records
- `status` (string, optional) - Filter by status: pending, applied, interview, offer, rejected

**Response:**
```json
[
  {
    "id": 1,
    "title": "Senior Software Engineer",
    "company": "Google",
    "location": "Mountain View, CA",
    "description": "Join our team...",
    "url": "https://careers.google.com/jobs/123",
    "salary": "$150,000 - $200,000",
    "status": "applied",
    "source": "linkedin",
    "match_score": 92,
    "team_id": 1,
    "user_id": 1,
    "created_at": "2026-02-07T01:00:00Z",
    "updated_at": "2026-02-07T01:00:00Z"
  }
]
```

---

### GET /jobs/{job_id}

Get a specific job by ID.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "id": 1,
  "title": "Senior Software Engineer",
  "company": "Google",
  "location": "Mountain View, CA",
  "description": "Join our team...",
  "url": "https://careers.google.com/jobs/123",
  "salary": "$150,000 - $200,000",
  "status": "applied",
  "source": "linkedin",
  "match_score": 92,
  "team_id": 1,
  "user_id": 1,
  "created_at": "2026-02-07T01:00:00Z",
  "updated_at": "2026-02-07T01:00:00Z"
}
```

**Status Codes:**
- `200 OK` - Job found
- `404 Not Found` - Job not found
- `403 Forbidden` - Access denied

---

### POST /jobs/

Create a new job.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "title": "Senior Software Engineer",
  "company": "Google",
  "location": "Mountain View, CA",
  "description": "Join our team...",
  "url": "https://careers.google.com/jobs/123",
  "salary": "$150,000 - $200,000",
  "status": "pending",
  "source": "linkedin",
  "match_score": 92
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Senior Software Engineer",
  "company": "Google",
  "location": "Mountain View, CA",
  "description": "Join our team...",
  "url": "https://careers.google.com/jobs/123",
  "salary": "$150,000 - $200,000",
  "status": "pending",
  "source": "linkedin",
  "match_score": 92,
  "team_id": 1,
  "user_id": 1,
  "created_at": "2026-02-07T01:00:00Z",
  "updated_at": "2026-02-07T01:00:00Z"
}
```

---

### POST /jobs/bulk

Create multiple jobs at once (max 100).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "jobs": [
    {
      "title": "Software Engineer",
      "company": "Company A",
      "location": "Remote"
    },
    {
      "title": "Backend Developer",
      "company": "Company B",
      "location": "New York, NY"
    }
  ]
}
```

**Response:**
```json
{
  "created": 2,
  "jobs": [...]
}
```

---

### PUT /jobs/{job_id}

Update an existing job.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "status": "interview",
  "match_score": 95
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Senior Software Engineer",
  "status": "interview",
  "match_score": 95,
  ...
}
```

---

### DELETE /jobs/{job_id}

Delete a job.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```
204 No Content
```

---

### GET /jobs/search

Search jobs by title or company.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `q` (string, required) - Search query
- `skip` (int, default: 0)
- `limit` (int, default: 100)

**Response:**
```json
[
  {
    "id": 1,
    "title": "Senior Software Engineer",
    "company": "Google",
    ...
  }
]
```

---

### GET /jobs/stats/summary

Get job statistics for the team.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "total": 150,
  "by_status": {
    "pending": 20,
    "applied": 80,
    "interview": 30,
    "offer": 10,
    "rejected": 10
  },
  "by_source": {
    "linkedin": 100,
    "indeed": 30,
    "manual": 20
  }
}
```

---

### PATCH /jobs/{job_id}/status

Update job status.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "status": "interview"
}
```

**Response:**
```json
{
  "id": 1,
  "status": "interview",
  ...
}
```

---

## Resumes

### POST /resumes/upload

Upload a resume file (PDF).

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Request:**
```
file: resume.pdf (binary)
```

**Response:**
```json
{
  "id": 1,
  "filename": "resume.pdf",
  "path": "/uploads/1/20260207_resume.pdf",
  "user_id": 1,
  "team_id": 1,
  "created_at": "2026-02-07T01:00:00Z"
}
```

---

### GET /resumes/

List all resumes for the team.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `skip` (int, default: 0)
- `limit` (int, default: 100)

**Response:**
```json
[
  {
    "id": 1,
    "filename": "resume.pdf",
    "path": "/uploads/1/20260207_resume.pdf",
    "user_id": 1,
    "team_id": 1,
    "created_at": "2026-02-07T01:00:00Z"
  }
]
```

---

### GET /resumes/{resume_id}

Get resume details.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "id": 1,
  "filename": "resume.pdf",
  "path": "/uploads/1/20260207_resume.pdf",
  "user_id": 1,
  "team_id": 1,
  "created_at": "2026-02-07T01:00:00Z"
}
```

---

### GET /resumes/{resume_id}/download

Download resume file.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```
Binary file (application/pdf)
```

---

### DELETE /resumes/{resume_id}

Delete a resume.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```
204 No Content
```

---

### GET /resumes/job/{job_id}

Get resume for a specific job.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "id": 1,
  "filename": "resume.pdf",
  "job_id": 1,
  ...
}
```

---

## Statistics

### GET /stats/

Get team statistics.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "total_applied": 150,
  "emailed": 80,
  "shortlisted": 40,
  "rejected": 10,
  "success_rate": 26.7,
  "daily_activity": [
    {
      "date": "2026-02-01",
      "jobs": 15
    }
  ],
  "status_distribution": [
    {
      "name": "Applied",
      "value": 80
    },
    {
      "name": "Interview",
      "value": 30
    }
  ]
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 409 Conflict
```json
{
  "detail": "Resource already exists"
}
```

### 422 Unprocessable Entity
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "detail": "An internal error occurred"
}
```

---

## Rate Limiting

- **Rate Limit:** 100 requests per minute per user
- **Headers:**
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `skip` (int, default: 0) - Number of records to skip
- `limit` (int, default: 100, max: 1000) - Maximum records to return

**Response Headers:**
- `X-Total-Count`: Total number of records
- `X-Page`: Current page number
- `X-Per-Page`: Records per page

---

## Interactive API Documentation

FastAPI provides interactive API documentation:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI Schema:** http://localhost:8000/openapi.json
