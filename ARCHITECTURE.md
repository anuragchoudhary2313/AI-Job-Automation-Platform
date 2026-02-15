# Architecture Documentation

## System Overview

The AI Job Automation SaaS platform is a full-stack application designed to automate job search and application processes using AI.

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend (React + TypeScript)"
        UI[User Interface]
        Hooks[Custom Hooks]
        Types[Type Definitions]
        Utils[Utilities]
    end
    
    subgraph "Backend (FastAPI + Python)"
        Routes[API Routes]
        Services[Service Layer]
        Repos[Repository Layer]
        DB[(PostgreSQL)]
    end
    
    subgraph "Bot Engine (Python)"
        Scrapers[Job Scrapers]
        AI[AI/ML Models]
        Automation[Automation]
        Comms[Communications]
    end
    
    UI --> Routes
    Routes --> Services
    Services --> Repos
    Repos --> DB
    Services --> Scrapers
    Services --> AI
    Services --> Automation
    Automation --> Comms
```

---

## Backend Architecture

### Layered Architecture Pattern

```mermaid
graph TD
    A[API Routes Layer] --> B[Service Layer]
    B --> C[Repository Layer]
    C --> D[Database Layer]
    
    style A fill:#e1f5ff
    style B fill:#fff9c4
    style C fill:#f3e5f5
    style D fill:#c8e6c9
```

### Component Breakdown

#### 1. API Routes Layer
**Responsibility:** HTTP request handling, validation, response formatting

**Components:**
- `auth.py` - Authentication endpoints
- `jobs.py` - Job management endpoints
- `resumes.py` - Resume operations endpoints
- `stats.py` - Statistics endpoints

**Key Features:**
- Request validation (Pydantic)
- Response serialization
- HTTP status codes
- Dependency injection

#### 2. Service Layer
**Responsibility:** Business logic, authorization, orchestration

**Components:**
- `AuthService` - User authentication, token management
- `JobService` - Job CRUD, search, statistics
- `ResumeService` - Resume operations
- `TeamService` - Team management

**Key Features:**
- Business rule enforcement
- Authorization checks
- Transaction management
- Error handling

#### 3. Repository Layer
**Responsibility:** Data access, database queries

**Components:**
- `BaseRepository<T>` - Generic CRUD operations
- `UserRepository` - User data access
- `JobRepository` - Job data access
- `ResumeRepository` - Resume data access
- `TeamRepository` - Team data access

**Key Features:**
- Type-safe queries
- Async operations
- Query optimization
- Error handling

#### 4. Database Layer
**Technology:** PostgreSQL with SQLAlchemy (async)

**Models:**
- `User` - User accounts
- `Team` - Team/organization
- `Job` - Job postings
- `Resume` - Resume files
- `Log` - System logs

---

## Frontend Architecture

### Component Hierarchy

```mermaid
graph TD
    App[App.tsx] --> Router[React Router]
    Router --> Pages[Page Components]
    Pages --> Features[Feature Components]
    Features --> Common[Common Components]
    Features --> UI[UI Components]
    
    Pages --> Hooks[Custom Hooks]
    Hooks --> API[API Client]
    
    style App fill:#e1f5ff
    style Pages fill:#fff9c4
    style Features fill:#f3e5f5
    style Hooks fill:#c8e6c9
```

### Directory Structure

```
frontend/src/
├── components/          # Reusable components
│   ├── common/         # Common UI elements
│   ├── features/       # Feature-specific components
│   ├── layout/         # Layout components
│   └── ui/             # Base UI components
├── hooks/              # Custom React hooks
│   ├── useAuth.ts
│   ├── useJobs.ts
│   ├── useResumes.ts
│   └── ...
├── types/              # TypeScript type definitions
│   ├── api.ts
│   ├── models.ts
│   ├── components.ts
│   └── hooks.ts
├── utils/              # Utility functions
│   ├── logger.ts
│   └── api.ts
├── pages/              # Page components
│   ├── Dashboard/
│   ├── Jobs/
│   ├── Resumes/
│   └── ...
└── context/            # React context providers
```

### State Management

```mermaid
graph LR
    A[Component] --> B[Custom Hook]
    B --> C[API Client]
    C --> D[Backend API]
    D --> C
    C --> B
    B --> E[Local State]
    E --> A
```

**Strategy:**
- Custom hooks for data fetching
- React Context for global state
- Local state for UI state
- No external state management library (Redux, etc.)

---

## Data Flow

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth API
    participant S as AuthService
    participant R as UserRepository
    participant D as Database
    
    U->>F: Enter credentials
    F->>A: POST /auth/login
    A->>S: authenticate_user()
    S->>R: get_by_email()
    R->>D: SELECT user
    D-->>R: User data
    R-->>S: User object
    S->>S: verify_password()
    S->>S: create_tokens()
    S-->>A: User + Tokens
    A-->>F: Access + Refresh tokens
    F->>F: Store tokens
    F-->>U: Redirect to dashboard
```

### Job Creation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Jobs API
    participant S as JobService
    participant R as JobRepository
    participant D as Database
    
    U->>F: Create job
    F->>A: POST /jobs/
    A->>A: Validate request
    A->>S: create_job()
    S->>S: Check authorization
    S->>R: create()
    R->>D: INSERT job
    D-->>R: Job ID
    R-->>S: Job object
    S-->>A: Job data
    A-->>F: 201 Created
    F-->>U: Show success
```

---

## Security Architecture

### Authentication & Authorization

```mermaid
graph TD
    A[Request] --> B{Has Token?}
    B -->|No| C[401 Unauthorized]
    B -->|Yes| D{Valid Token?}
    D -->|No| C
    D -->|Yes| E{Has Permission?}
    E -->|No| F[403 Forbidden]
    E -->|Yes| G[Process Request]
```

**Security Layers:**
1. **JWT Authentication** - Bearer token validation
2. **Password Hashing** - bcrypt with salt
3. **Token Refresh** - Refresh token rotation
4. **Rate Limiting** - 100 req/min per user
5. **Input Validation** - Pydantic schemas
6. **SQL Injection Prevention** - SQLAlchemy ORM
7. **CORS** - Configured allowed origins

---

## Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    TEAM ||--o{ USER : has
    TEAM ||--o{ JOB : owns
    TEAM ||--o{ RESUME : owns
    USER ||--o{ JOB : creates
    USER ||--o{ RESUME : uploads
    JOB ||--o| RESUME : uses
    
    TEAM {
        int id PK
        string name
        string description
        datetime created_at
    }
    
    USER {
        int id PK
        string email UK
        string username UK
        string password_hash
        string full_name
        string role
        int team_id FK
        datetime created_at
    }
    
    JOB {
        int id PK
        string title
        string company
        string location
        text description
        string url
        string salary
        string status
        string source
        int match_score
        int team_id FK
        int user_id FK
        datetime created_at
    }
    
    RESUME {
        int id PK
        string filename
        string path
        int job_id FK
        int team_id FK
        int user_id FK
        datetime created_at
    }
```

---

## Deployment Architecture

### Production Setup

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx]
    end
    
    subgraph "Application Servers"
        API1[FastAPI Instance 1]
        API2[FastAPI Instance 2]
    end
    
    subgraph "Static Assets"
        CDN[CDN / S3]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        Redis[(Redis Cache)]
    end
    
    subgraph "Background Jobs"
        Worker1[Celery Worker 1]
        Worker2[Celery Worker 2]
        Queue[Message Queue]
    end
    
    LB --> API1
    LB --> API2
    LB --> CDN
    API1 --> DB
    API2 --> DB
    API1 --> Redis
    API2 --> Redis
    API1 --> Queue
    API2 --> Queue
    Queue --> Worker1
    Queue --> Worker2
```

---

## Technology Stack

### Backend
- **Framework:** FastAPI 0.104+
- **Language:** Python 3.11+
- **Database:** PostgreSQL 15+
- **ORM:** SQLAlchemy 2.0+ (async)
- **Authentication:** python-jose (JWT)
- **Validation:** Pydantic 2.0+
- **Cache:** Redis
- **Task Queue:** Celery
- **Web Server:** Uvicorn

### Frontend
- **Framework:** React 18+
- **Language:** TypeScript 5.0+
- **Build Tool:** Vite 5.0+
- **Routing:** React Router 6+
- **Styling:** TailwindCSS 3+
- **Charts:** Recharts
- **Icons:** Lucide React
- **HTTP Client:** Fetch API

### Bot Engine
- **Scraping:** Selenium, BeautifulSoup
- **AI/ML:** OpenAI GPT, scikit-learn
- **Resume:** LaTeX, PyPDF2
- **Email:** SMTP, Jinja2 templates

### DevOps
- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus, Grafana
- **Logging:** ELK Stack

---

## Performance Considerations

### Backend Optimizations
1. **Async Operations** - All I/O operations are async
2. **Connection Pooling** - Database connection pool
3. **Query Optimization** - Indexed columns, efficient queries
4. **Caching** - Redis for frequently accessed data
5. **Pagination** - Limit result sets
6. **Lazy Loading** - Load related data on demand

### Frontend Optimizations
1. **Code Splitting** - Lazy load routes
2. **Tree Shaking** - Remove unused code
3. **Memoization** - React.memo, useMemo, useCallback
4. **Virtual Scrolling** - For large lists
5. **Image Optimization** - Lazy loading, WebP format
6. **Bundle Size** - Minimize dependencies

---

## Scalability

### Horizontal Scaling
- **Stateless API** - Can run multiple instances
- **Load Balancing** - Distribute traffic
- **Database Replication** - Read replicas
- **Caching Layer** - Reduce database load
- **CDN** - Static asset delivery

### Vertical Scaling
- **Database Optimization** - Indexes, partitioning
- **Connection Pooling** - Efficient resource usage
- **Query Optimization** - Reduce query complexity
- **Caching** - In-memory data storage

---

## Monitoring & Logging

### Logging Strategy
```
Application Logs → Structured JSON → File Rotation → ELK Stack
```

**Log Levels:**
- DEBUG - Development debugging
- INFO - General information
- WARNING - Warning messages
- ERROR - Error conditions
- CRITICAL - Critical failures

### Metrics
- Request rate
- Response time
- Error rate
- Database query time
- Cache hit rate
- Active users

---

## Future Enhancements

1. **Microservices** - Split into smaller services
2. **GraphQL** - Alternative API layer
3. **WebSockets** - Real-time updates
4. **Message Queue** - Async job processing
5. **Multi-tenancy** - Better team isolation
6. **API Versioning** - Support multiple API versions
