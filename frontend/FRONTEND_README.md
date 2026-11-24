# InvoicerAI — Frontend Architecture & Integration Guide

InvoicerAI is a modern, minimal, editorial AI-powered invoice digitization and business insights application designed specifically for Indian small business owners and shopkeepers.

---

## 1. Architecture Overview

The frontend is built with:
- **Framework**: React 18 with TypeScript
- **Bundler & Dev Server**: Vite 6
- **Styling**: Tailwind CSS with a custom warm editorial palette (Mustard yellow, burnt orange, warm off-white, charcoal text)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Live Streams**: Fetch-based `ReadableStream` Server-Sent Events (SSE) reader for live AI extraction and LangGraph chat streaming

```
src/
├── api/
│   ├── client.ts             # Central Fetch client with automatic Bearer token injection,
│   │                         # 401 interceptor, and HttpOnly refresh token rotation
│   ├── auth.ts               # Registration, login, session /me, and logout
│   ├── invoices.ts           # Upload, list (with filters), get, update, delete, review, confirm
│   ├── tasks.ts              # Durable task status and SSE stream reader
│   ├── conversations.ts      # Conversation and message history CRUD
│   ├── chat.ts               # SSE stream reader for POST /chat
│   └── analytics.ts          # Revenue summary and daily revenue analytics
├── types/
│   ├── auth.ts               # User, Login, Register payloads
│   ├── invoice.ts            # Invoice, InvoiceItem, Review, Extraction types
│   ├── task.ts               # AITask, TaskStatusSSEEvent types
│   ├── chat.ts               # Conversation, ChatMessage, SSE event types
│   └── analytics.ts          # RevenueSummary, DailyRevenueItem types
├── context/
│   ├── AuthContext.tsx       # Auth provider with access token in memory & silent refresh
│   └── ToastContext.tsx      # Application-level notification system
├── hooks/
│   ├── useAuth.ts            # Hook to access user auth state and actions
│   ├── useToast.ts           # Hook to trigger success, error, warning, info toasts
│   └── useTaskSSE.ts         # Resilient hook to track background Celery extraction tasks
├── components/
│   ├── common/
│   │   ├── Button.tsx        # Crisp, flat button with mustard, burnt orange, outline, ghost styles
│   │   ├── Input.tsx         # Accessible input with label, prefix icon, and error states
│   │   ├── Card.tsx          # Editorial flat surface with 1px border and header/footer slots
│   │   ├── Modal.tsx         # Accessible dialog for confirmations and image zooms
│   │   ├── Spinner.tsx       # Warm minimal loading indicator
│   │   └── EmptyState.tsx    # Clean state with icon, title, description, and action CTA
│   ├── layout/
│   │   ├── AppLayout.tsx     # Persistent authenticated app shell (desktop sidebar & mobile drawer)
│   │   └── ProtectedRoute.tsx# Auth gate redirecting unauthenticated users to /login
│   ├── invoice/
│   │   ├── InvoiceStatusBadge.tsx    # DRAFT, CONFIRMED, CANCELLED indicators
│   │   ├── ExtractionQualityBadge.tsx# Score and quality label display
│   │   └── LineItemTable.tsx         # Line-item editor (add, edit, delete, recalculations)
│   └── chat/
│       ├── ChatMessage.tsx   # User / Assistant message bubbles with timestamps
│       ├── ToolEventBadge.tsx# Real-time tool execution status badges
│       └── SuggestedPrompts.tsx      # Pre-populated questions aligned with backend capabilities
├── pages/
│   ├── LandingPage.tsx       # Marketing landing page with hero, 3 alternating features, how-it-works, CTA
│   ├── LoginPage.tsx         # Shopkeeper login with validation and error alerts
│   ├── RegisterPage.tsx      # Registration with auto-login and duplicate check handling
│   ├── DashboardPage.tsx     # Central dashboard: 3 quick action cards, stats, and recent invoices
│   ├── InvoiceUploadPage.tsx # Drag & drop file picker, preview, SSE extraction progress, duplicate warnings
│   ├── InvoiceReviewPage.tsx # Side-by-side original image & editable items, explicit confirm dialog
│   ├── InvoiceHistoryPage.tsx# Invoices listing with search, filters, pagination, and delete modal
│   ├── InvoiceDetailPage.tsx # Confirmed invoice detail view with image zoom and breakdown
│   ├── ChatPage.tsx          # AI chat with conversation sidebar, SSE token streaming, and tools
│   └── NotFoundPage.tsx      # 404 page with return to home/dashboard
├── App.tsx                   # Route definitions and context providers
├── main.tsx                  # React entry point
└── index.css                 # Base styles and scrollbar styling
```

---

## 2. Verified Backend API Contract Matrix

| Endpoint | Method | Auth Required | Request Payload / Params | Response | Description |
|---|---|---|---|---|---|
| `/auth/register` | `POST` | No | `{ username, email, password }` | `UserResponse` (201) | Registers new user account |
| `/auth/login` | `POST` | No | `{ email, password }` | `{ access_token, token_type }` + HttpOnly cookie | Logs in, sets refresh token cookie |
| `/auth/refresh` | `POST` | No (Cookie) | HttpOnly cookie | `{ access_token, token_type }` + rotated cookie | Rotates refresh token & issues new access token |
| `/auth/logout` | `POST` | Cookie | HttpOnly cookie | `{ message }` | Revokes refresh session and clears cookie |
| `/auth/me` | `GET` | Bearer | Header: `Authorization: Bearer <token>` | `UserResponse` | Returns authenticated user profile |
| `/invoices/upload` | `POST` | Bearer | Multipart: `file`, Query: `allow_duplicate` | `UploadInvoiceResponse` (201) / 409 Conflict | Uploads receipt, creates draft invoice & AI task |
| `/invoices` | `GET` | Bearer | Query: `page`, `page_size`, `status`, `customer_name`, `date_from`, `date_to`, `min_amount`, `max_amount` | `InvoiceListResponse` | Paginated and filtered invoices list |
| `/invoices/{id}` | `GET` | Bearer | Path: `id` | `InvoiceResponse` | Retrieves single invoice record and line items |
| `/invoices/{id}` | `DELETE` | Bearer | Path: `id` | 204 No Content | Deletes invoice record |
| `/invoices/{id}/review` | `GET` | Bearer | Path: `id` (must be `DRAFT`) | `InvoiceReviewResponse` | Returns invoice and latest AI raw extraction data |
| `/invoices/{id}/review` | `PATCH` | Bearer | Path: `id`, Body: `InvoiceReviewUpdate` | `InvoiceResponse` | Updates draft header fields (dates, customer, totals) |
| `/invoices/{id}/review/items` | `POST` | Bearer | Path: `id`, Body: `InvoiceItemReviewCreate` | `InvoiceResponse` | Adds new line item to draft invoice |
| `/invoices/{id}/review/items/{item_id}` | `PATCH` | Bearer | Path: `id`, `item_id`, Body: `InvoiceItemReviewUpdate` | `InvoiceResponse` | Edits line item on draft invoice |
| `/invoices/{id}/review/items/{item_id}` | `DELETE` | Bearer | Path: `id`, `item_id` | `InvoiceResponse` | Deletes line item and recalculates totals |
| `/invoices/{id}/confirm` | `POST` | Bearer | Path: `id` | `InvoiceResponse` | Explicit confirmation; transitions status from `DRAFT` to `CONFIRMED` |
| `/tasks/{task_id}` | `GET` | Bearer | Path: `task_id` | `TaskStatusResponse` | Durable AI task state from PostgreSQL |
| `/tasks/{task_id}/stream` | `GET` | Bearer | Path: `task_id`, Header: `Accept: text/event-stream` | SSE Stream (`event: task_status`) | Live updates for background Celery extraction |
| `/conversations` | `GET` | Bearer | Query: `limit`, `offset` | `ConversationListResponse` | Lists user conversations |
| `/conversations` | `POST` | Bearer | Body: `{ title }` | `ConversationResponse` (201) | Creates new conversation thread |
| `/conversations/{id}` | `DELETE` | Bearer | Path: `id` | 204 No Content | Deletes conversation thread |
| `/conversations/{id}/messages` | `GET` | Bearer | Path: `id`, Query: `limit`, `offset` | `MessageHistoryResponse` | Loads persisted message history |
| `/chat` | `POST` | Bearer | Body: `{ message, conversation_id }`, `Accept: text/event-stream` | SSE Stream (`token`, `tool_start`, `tool_end`, `complete`) | Streams LangGraph AI agent response |
| `/analytics/summary` | `GET` | Bearer | Query: `start_date`, `end_date` | `RevenueSummaryResponse` | Billed revenue total, count, and average for confirmed bills |
| `/analytics/daily-revenue` | `GET` | Bearer | Query: `start_date`, `end_date` | `DailyRevenueResponse` | Daily billed revenue breakdown |

---

## 3. Key Design & Implementation Decisions

### 1. Distinction Between Draft and Confirmed
An extracted invoice is **never** automatically confirmed. Newly uploaded invoices remain in the `DRAFT` state until the user reviews the fields, verifies line items, and clicks the explicit **Confirm Bill** action. Only `CONFIRMED` invoices are included in analytics calculations or queried by the AI business assistant.

### 2. Authentication & Token Management
- Access tokens are stored in memory and attached as `Authorization: Bearer <token>`.
- The refresh token is maintained exclusively in an `HttpOnly` cookie by the FastAPI backend (`path="/auth"`).
- The central client handles 401 errors by calling `POST /auth/refresh` once, queuing pending requests, and replaying the original request with the fresh token.

### 3. Server-Sent Events (SSE) via Fetch ReadableStream
Native browser `EventSource` does not support custom `Authorization: Bearer` headers or `POST` request bodies. Both the task progress listener (`/tasks/{task_id}/stream`) and the AI chat streaming client (`POST /chat`) use a custom `fetch()`-based `ReadableStream` parser that handles:
- Authorization headers
- Cross-chunk frame splitting and buffer accumulation
- Event parsing (`event: ...`, `data: ...`)
- Keep-alive pings (`: keep-alive`)
- Graceful termination on `COMPLETED` / `FAILED` events

### 4. Indian Small-Business Editorial Aesthetic
The UI implements a warm, grounded small-business personality:
- **Primary Color**: Warm mustard / golden yellow (`#D97706` / `#C89312`)
- **Secondary Accent**: Burnt orange (`#C2410C`)
- **Backgrounds**: Soft off-white / warm neutral (`#FAF7F0` and `#FDFCF9`)
- **Typography**: Clean Plus Jakarta Sans with crisp charcoal typography (`#1E1E1E`)
- **Shapes & Dividers**: Flat surfaces with restrained 1px borders and subtle corners (`rounded-sm`), avoiding generic SaaS glassmorphism, heavy shadows, or pill buttons.

---

## 4. Running the Frontend

### Prerequisites
- Node.js (v18+)
- Backend running at `http://localhost:8000`

### Development
```bash
# Install dependencies
npm install

# Start Vite dev server (runs on http://localhost:5173 or 5174)
npm run dev
```

### Production Build
```bash
# Typecheck and bundle
npm run build

# Preview production build locally
npm run preview
```
