# InvoicerAI

**AI-powered invoice digitization, human-in-the-loop verification, and conversational business analytics for Indian shopkeepers.**


![Landing Page](readme_screenshots/landing.png)

InvoicerAI transforms paper and digital invoices into structured, verified financial records. Shopkeepers can upload invoice images, track real-time AI extraction, review and correct line items before confirming, view revenue analytics, and ask natural-language questions about their sales, customers, and products.

---

## Table of Contents

- [Purpose & Problem Statement](#purpose--problem-statement)
- [Product Tour](#product-tour)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [End-to-End Request Flows](#end-to-end-request-flows)
  - [1. Invoice Upload & Async AI Extraction](#1-invoice-upload--async-ai-extraction)
  - [2. Conversational AI Analytics (LangGraph)](#2-conversational-ai-analytics-langgraph)
  - [3. Authentication & Refresh Token Rotation](#3-authentication--refresh-token-rotation)
- [API Overview](#api-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Running Tests](#running-tests)

---

## Purpose & Problem Statement

Small and medium Indian retail businesses still rely heavily on handwritten bills, thermal receipts, and unstructured supplier/customer invoices. Manually entering these records into spreadsheets or accounting tools is slow and error-prone, while generic OCR tools fail to validate totals or provide actionable insights.

InvoicerAI solves this end-to-end:
1. **Digitize effortlessly** — Upload any invoice photo (`JPEG`, `PNG`, `WEBP`) and extract header fields and line items asynchronously using vision-capable LLMs.
2. **Verify with confidence** — Every extraction is scored for quality and validated mathematically (`subtotal + tax - discount == total_amount`), then presented in a side-by-side Human-in-the-Loop (HITL) review screen before confirmation.
3. **Analyze in plain language** — Ask questions like *"What was my revenue last week?"* or *"Which customer has the highest spend?"* through an intent-routed LangGraph assistant backed by compiled SQL queries.

---

## Product Tour

### Revenue & Operations Dashboard
![Dashboard](readme_screenshots/dashboard.png)

### Invoice Upload & Real-Time Extraction Progress
![Uploading Invoice](readme_screenshots/uploading.png)

### Extraction Result & Human-in-the-Loop Review
![Extraction Result](readme_screenshots/result.png)

### Conversational AI Business Assistant
![AI Chat Assistant](readme_screenshots/chat.png)

---

## Key Features

- **Async Multimodal Invoice Extraction**: Offloads image processing to Celery workers using Gemini / Groq LLM providers with automatic fallback support (`provider_factory.py`, `fallback.py`).
- **Real-Time Progress via SSE**: Streams background task state transitions (`PENDING` → `PROCESSING` → `COMPLETED` / `FAILED`) over Server-Sent Events (`/tasks/{task_id}/stream`) powered by Redis Pub/Sub.
- **Validation & Quality Scoring**: Runs `ExtractionValidator`, `ExtractionQualityScorer`, and `ExtractionFailureClassifier` on raw LLM JSON, persisting `raw_extractions` alongside `quality_score` and `validation_results`.
- **SHA-256 Duplicate Detection**: Computes image hashes on upload to flag potential duplicate invoices (`is_duplicate`, `duplicate_of_invoice_id`).
- **Human-in-the-Loop (HITL) Review**: Invoices start as `DRAFT` and support full line-item editing (`/invoices/{invoice_id}/review`, `/invoices/{invoice_id}/review/items`) before explicit confirmation (`CONFIRMED`).
- **LangGraph Conversational Analytics**: Stateful multi-turn AI agent persisted with `AsyncPostgresSaver` checkpointing, intent classification, context management, and safe compiled database query tools.
- **Security & Reliability**: Short-lived JWT access tokens, `HttpOnly` refresh token rotation (`RefreshSession`), idempotency keys (`IdempotencyRecord`), rate limiting, and entity-level `AuditLog` tracking.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite 6, Tailwind CSS, React Router v6, Lucide Icons, `react-markdown` + `remark-gfm` |
| **Backend API** | FastAPI, Python 3.12+, Uvicorn, Pydantic v2, `pydantic-settings` |
| **Database & ORM** | PostgreSQL, Async SQLAlchemy 2.x (`asyncpg`), Alembic migrations |
| **Async Workers & Streaming** | Celery, Redis (Broker, Result Backend & Pub/Sub), Server-Sent Events (SSE) |
| **AI & Orchestration** | LangGraph, LangChain (`langchain-core`, `langchain-google-genai`, `langchain-groq`), `google-genai`, `groq`, `langgraph-checkpoint-postgres` (`psycopg` + `psycopg-pool`) |
| **Media & Storage** | ImageKit (`imagekitio`), Pillow (`PIL`) |
| **Auth & Security** | PyJWT (`HS256`), `pwdlib` (Argon2 password hashing), `HttpOnly` refresh cookies |
| **Testing** | `pytest`, `pytest-asyncio`, `httpx` |

---

## System Architecture

```mermaid
flowchart TD
    Client["React + Vite Frontend<br/>(TypeScript, Tailwind CSS)"]

    subgraph API["FastAPI Backend (app/main.py)"]
        Router["API Routers<br/>/auth, /invoices, /tasks, /analytics, /conversations, /chat"]
        Services["Server Services<br/>Auth, Upload, Invoice, Analytics, Audit"]
        Graph["LangGraph Agent (invoice_graph)<br/>Intent -> Context -> Analytical / Rejection"]
    end

    subgraph Async["Async Processing & Messaging"]
        Redis[("Redis<br/>Broker / Result Backend / PubSub")]
        Worker["Celery Worker<br/>(app/workers/tasks/extraction.py)"]
    end

    subgraph External["External Services"]
        ImageKit["ImageKit CDN<br/>(Invoice Image Storage)"]
        LLM["LLM Providers<br/>(Groq / Google Gemini)"]
    end

    subgraph DB["PostgreSQL"]
        AppTables[("Application Tables<br/>users, invoices, invoice_items,<br/>raw_extractions, ai_tasks, etc.")]
        Checkpoints[("LangGraph Checkpointer<br/>(AsyncPostgresSaver)")]
    end

    Client -- "REST + SSE + Cookies" --> Router
    Router --> Services
    Router --> Graph
    Services --> AppTables
    Services -- "Upload Image" --> ImageKit
    Services -- "Enqueue Task" --> Redis
    Redis --> Worker
    Worker -- "Fetch Image / Extract" --> LLM
    Worker -- "Save Extraction & Score" --> AppTables
    Worker -- "Publish Status Event" --> Redis
    Redis -- "Subscribe SSE" --> Router
    Graph -- "Read/Write Thread State" --> Checkpoints
    Graph -- "Compiled Queries" --> AppTables
    Graph -- "Inference" --> LLM
```

---

## Database Schema

InvoicerAI uses PostgreSQL with native enum types (`currency`, `invoice_status`, `message_role`, `ai_task_status`, `ai_task_type`) and 10 core application tables:

```mermaid
erDiagram
    users ||--o{ refresh_sessions : "has"
    users ||--o{ invoices : "owns"
    users ||--o{ ai_tasks : "triggers"
    users ||--o{ conversations : "starts"
    users ||--o{ audit_logs : "generates"
    users ||--o{ idempotency_records : "scoped to"

    invoices ||--o{ invoice_items : "contains"
    invoices ||--o{ raw_extractions : "records"
    invoices ||--o| invoices : "duplicate_of"

    conversations ||--o{ messages : "contains"

    users {
        uuid id PK
        string username
        string email UK
        string password_hash
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    refresh_sessions {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        timestamptz expires_at
        timestamptz revoked_at
        timestamptz last_used_at
        timestamptz created_at
    }

    invoices {
        uuid id PK
        uuid user_id FK
        string invoice_number
        date invoice_date
        string customer_name
        string customer_phone
        numeric subtotal
        numeric tax
        numeric discount
        numeric total_amount
        currency currency
        text image_url
        string image_file_id
        string image_hash
        boolean is_duplicate
        uuid duplicate_of_invoice_id FK
        invoice_status status
        timestamptz created_at
        timestamptz updated_at
    }

    invoice_items {
        uuid id PK
        uuid invoice_id FK
        string product_name
        numeric quantity
        numeric unit_price
        numeric total_price
        timestamptz created_at
        timestamptz updated_at
    }

    raw_extractions {
        uuid id PK
        uuid invoice_id FK
        jsonb raw_json
        string model_name
        string prompt_version
        numeric confidence_score
        jsonb validation_results
        integer quality_score
        timestamptz created_at
    }

    ai_tasks {
        uuid id PK
        uuid user_id FK
        ai_task_type task_type
        ai_task_status status
        string celery_task_id UK
        text error_message
        timestamptz created_at
        timestamptz started_at
        timestamptz completed_at
    }

    conversations {
        uuid id PK
        uuid user_id FK
        string title
        timestamptz created_at
        timestamptz updated_at
    }

    messages {
        uuid id PK
        uuid conversation_id FK
        message_role role
        text content
        jsonb metadata
        timestamptz created_at
    }

    audit_logs {
        uuid id PK
        uuid user_id FK
        string action
        string entity_type
        uuid entity_id
        jsonb before
        jsonb after
        timestamptz created_at
    }

    idempotency_records {
        uuid id PK
        uuid user_id FK
        string idempotency_key
        string request_hash
        jsonb response_json
        uuid invoice_id
        timestamptz created_at
    }
```

### Table Summary

| Table | Purpose | Key Indexes / Constraints |
| :--- | :--- | :--- |
| `users` | Registered shopkeeper accounts | `email` unique index |
| `refresh_sessions` | Active & revoked refresh token hashes | `token_hash` unique, `user_id`, `expires_at` |
| `invoices` | Core invoice headers, totals, and status (`DRAFT`, `CONFIRMED`, `CANCELLED`) | `ix_invoices_user_date (user_id, invoice_date)`, `image_hash` |
| `invoice_items` | Line items linked to an invoice | `ix_invoice_items_invoice_id (invoice_id)` |
| `raw_extractions` | Raw LLM JSON output, model/prompt metadata, validation & quality scores | `invoice_id` FK (`CASCADE`) |
| `ai_tasks` | Background Celery job state (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`) | `celery_task_id` unique, `ix_ai_tasks_user_created` |
| `conversations` | Chat threads per user | `ix_conversations_user_updated (user_id, updated_at)` |
| `messages` | Ordered chat messages (`USER`, `ASSISTANT`, `SYSTEM`, `TOOL`) | `ix_messages_conversation_created` |
| `audit_logs` | Before/after JSONB snapshots of mutations | `ix_audit_logs_user_created`, `ix_audit_logs_entity` |
| `idempotency_records` | Prevents duplicate mutating invoice requests | `uq_idempotency_user_key (user_id, idempotency_key)` |

---

## End-to-End Request Flows

### 1. Invoice Upload & Async AI Extraction

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (React)
    participant API as FastAPI (/invoices & /tasks)
    participant IK as ImageKit
    participant DB as PostgreSQL
    participant Redis as Redis (Broker & PubSub)
    participant Worker as Celery Worker
    participant LLM as Gemini / Groq Vision

    User->>FE: Select invoice image & upload
    FE->>API: POST /invoices/upload (multipart/form-data)
    API->>API: Validate MIME type, size & compute SHA-256 hash
    API->>IK: Upload image binary
    IK-->>API: image_url & image_file_id
    API->>DB: Create DRAFT Invoice + AITask (PENDING)
    API->>Redis: Enqueue process_invoice task
    API-->>FE: 201 Created (invoice_id, task_id)

    FE->>API: GET /tasks/{task_id}/stream (SSE)
    API->>Redis: Subscribe to channel ai_task:{task_id}

    Worker->>Redis: Consume task
    Worker->>DB: Update AITask -> PROCESSING
    Worker->>Redis: Publish PROCESSING event
    Redis-->>API: Forward event
    API-->>FE: SSE event: PROCESSING

    Worker->>LLM: Extract structured invoice JSON
    LLM-->>Worker: ExtractedInvoice payload
    Worker->>Worker: Validate math & compute quality_score
    Worker->>DB: Save RawExtraction, Invoice fields & InvoiceItems
    Worker->>DB: Update AITask -> COMPLETED
    Worker->>Redis: Publish COMPLETED event
    Redis-->>API: Forward event
    API-->>FE: SSE event: COMPLETED

    FE->>API: GET /invoices/{invoice_id}
    FE-->>User: Render HITL Review screen
    User->>FE: Edit fields/items (optional) & Confirm
    FE->>API: PATCH /invoices/{invoice_id}/review & POST /invoices/{invoice_id}/confirm
    API->>DB: Set status = CONFIRMED & write AuditLog
```

### 2. Conversational AI Analytics (LangGraph)

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (ChatPage)
    participant API as FastAPI (POST /chat)
    participant DB as PostgreSQL
    participant Graph as LangGraph (invoice_graph)
    participant Tools as Analytics & Search Tools
    participant LLM as Groq / Gemini LLM

    User->>FE: Ask business question
    FE->>API: POST /chat { message, conversation_id? }
    API->>DB: Create/verify Conversation & save USER Message
    API->>Graph: Stream graph with thread_id = conversation_id

    Graph->>LLM: intent_identification_node
    alt Unrelated or Upload Request
        Graph->>Graph: Route -> rejection_node
        Graph-->>API: Polite refusal message
    else Valid Analytics / Invoice Query
        Graph->>Graph: Route -> context_management_node
        Graph->>Tools: analytical_node invokes tools<br/>(data_discovery, query_tool, search_tool, invoice_details_tool)
        Tools->>DB: Execute validated, user-scoped SQL queries
        DB-->>Tools: Aggregated results / matching records
        Tools-->>Graph: Tool output
        Graph->>LLM: Synthesize markdown response
        Graph-->>API: Stream tokens & tool events via SSE
    end

    API->>DB: Persist ASSISTANT Message
    API-->>FE: SSE stream completes
```

### 3. Authentication & Refresh Token Rotation

1. **Register / Login**: `POST /auth/register` or `POST /auth/login` hashes/verifies passwords using Argon2 (`pwdlib`), issues a short-lived JWT access token (`15m` default), and sets a rotated `HttpOnly` refresh token cookie backed by a hashed `RefreshSession` row in PostgreSQL.
2. **Authenticated Requests**: Frontend sends `Authorization: Bearer <access_token>` on API calls; `get_current_user` validates the JWT signature, expiry, and token type.
3. **Silent Refresh**: On `401 Unauthorized`, the frontend client calls `POST /auth/refresh` (sending the `HttpOnly` cookie), revokes the previous `RefreshSession`, issues a new session + cookie + access token, and retries the original request.
4. **Logout**: `POST /auth/logout` revokes the active `RefreshSession` and clears the cookie.

---

## API Overview

| Prefix | Router File | Key Endpoints |
| :--- | :--- | :--- |
| `/health` | `backend/app/api/health.py` | `GET /health`, `GET /health/db` |
| `/auth` | `backend/app/api/auth.py` | `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`, `GET /me` |
| `/invoices` | `backend/app/api/invoices.py` | `POST /upload`, `GET /`, `GET /{id}`, `PATCH /{id}/review`, `POST /{id}/review/items`, `POST /{id}/confirm`, `DELETE /{id}` |
| `/tasks` | `backend/app/api/tasks.py` | `GET /{task_id}`, `GET /{task_id}/stream` (SSE) |
| `/analytics` | `backend/app/api/analytics.py` | `GET /summary`, `GET /daily-revenue` |
| `/conversations` | `backend/app/api/conversations.py` | `POST /`, `GET /`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}`, `GET /{id}/messages` |
| `/chat` | `backend/app/api/chat.py` | `POST /chat` (SSE streaming) |

Interactive OpenAPI documentation is available at `http://localhost:8000/docs` when the backend server is running.

---

## Project Structure

```text
invoicerAI/
├── package.json                        # Root workspace scripts (dev, build, preview)
├── readme_screenshots/                 # Application screenshots used in documentation
├── backend/
│   ├── alembic/                        # Database migration scripts
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── tests/                          # Pytest unit & integration tests
│   └── app/
│       ├── main.py                     # FastAPI app, CORS, LangGraph lifespan setup
│       ├── api/                        # Route handlers & auth dependencies
│       ├── config/                     # Settings, ImageKit, security, logging
│       ├── core/                       # Domain error definitions
│       ├── db/                         # Base, enums, async session, SQLAlchemy models
│       ├── middleware/                 # Auth, rate limiting, request ID middleware
│       ├── repositories/               # Data access layer
│       ├── schemas/                    # Pydantic request/response & extraction schemas
│       ├── services/
│       │   ├── ai/                     # LangGraph graph, nodes, routing, state, tools, checkpointer
│       │   ├── llm/                    # Gemini, Groq, fallback & provider factory
│       │   └── server/                 # Upload, extraction, validation, quality scoring, analytics, audit
│       └── workers/                    # Celery app & async extraction/embedding/cleanup tasks
└── frontend/
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── api/                        # Typed API clients (auth, invoices, tasks, analytics, chat)
        ├── components/                 # Reusable UI, chat, invoice review & layout components
        ├── context/                    # AuthContext & ToastContext
        ├── hooks/                      # useAuth, useTaskSSE, useToast
        ├── pages/                      # Landing, Login, Register, Dashboard, Upload, Review, History, Detail, Chat
        └── types/                      # TypeScript domain interfaces
```

---

## Getting Started

### Prerequisites

- **Python** 3.12+ (tested with 3.14)
- **Node.js** 18+ and `npm`
- **PostgreSQL** 14+
- **Redis** 6+
- **ImageKit** account (for invoice image storage)
- **Groq** and/or **Google Gemini** API key

### Environment Variables

Create `backend/.env` (see [backend/.env.example](backend/.env.example)):

```env
APP_NAME=InvoicerAI
APP_VERSION=1.0.0
DEBUG=True

# PostgreSQL (Async)
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/invoicerai

# JWT & Cookies
JWT_SECRET_KEY=your-secure-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
REFRESH_COOKIE_NAME=refresh_token
REFRESH_COOKIE_SECURE=False

# Redis & Celery
REDIS_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# ImageKit
IMAGEKIT_PRIVATE_KEY=your-imagekit-private-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# LLM Configuration
LLM_PROVIDER=groq
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=qwen/qwen3.8-27b
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.8-flash
```

### Backend Setup

1. Create and activate the virtual environment:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *(Ensure AI, worker, and testing packages such as `google-genai`, `groq`, `langchain`, `langgraph`, `langgraph-checkpoint-postgres`, `psycopg[binary]`, `psycopg-pool`, `pwdlib[argon2]`, `pyjwt`, `redis`, `celery`, `pillow`, `httpx`, `python-multipart`, `pydantic[email]`, `pytest`, and `pytest-asyncio` are installed in the environment.)*

3. Run database migrations:
   ```bash
   alembic upgrade head
   ```

4. Start the FastAPI server (Terminal 1):
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. Start the Celery worker (Terminal 2):
   ```bash
   celery -A app.workers.celery_app worker --loglevel=info
   ```

### Frontend Setup

From the project root or `frontend/` directory:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### Running Tests

```bash
cd backend
./venv/bin/pytest
```
