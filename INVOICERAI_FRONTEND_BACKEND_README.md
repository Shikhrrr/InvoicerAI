# InvoicerAI Frontend Integration — Backend Reference

This document is the backend contract/context for building the React frontend. It is based on the InvoicerAI project knowledge and implemented features discussed so far. **The backend repository and its OpenAPI schema are the source of truth for exact paths, request/response fields, and event payloads.** Before coding API integration, inspect the actual backend route files and `GET /openapi.json` (or Swagger UI) and update this document if anything differs. Do not invent endpoints or fields.

## 1. Product

InvoicerAI is an AI-powered invoice digitization and business-insights application for Indian shopkeepers and small businesses.

Core workflow:
1. User registers/logs in.
2. Upload an invoice image.
3. Backend creates an invoice in `DRAFT` state and a durable AI task.
4. AI extracts invoice details and line items asynchronously.
5. Frontend receives task status via SSE.
6. User reviews and edits extracted fields/items.
7. User explicitly confirms the invoice.
8. User can view/search/filter invoices and ask questions about saved business data through AI chat.

**Critical rule:** Extraction is not confirmation. A newly uploaded/extracted invoice remains `DRAFT` until the user explicitly confirms it.

## 2. Technology and boundaries

- Frontend: React, Tailwind CSS (already installed).
- Backend: FastAPI.
- DB: PostgreSQL; async SQLAlchemy.
- Auth: JWT access token + refresh-token flow; refresh token stored in HttpOnly cookie; refresh rotation/revocation.
- Images: ImageKit. Private ImageKit keys must never reach the frontend.
- Background extraction: Celery + Redis.
- Live updates: SSE. No WebSockets and no polling for normal progress.
- AI chat: LangGraph agent; backend streams chat output/events through SSE.
- LLM/provider credentials are backend-only.
- SQL-backed analytics are authoritative for numerical results. The frontend should render returned results, not calculate financial truth independently.

## 3. Domain entities and statuses

### User
Registration/login identity. The authenticated user is derived server-side. Never send or trust a user ID as authorization.

### Invoice
Common fields include UUID ID, invoice number, date, customer name/phone, subtotal, tax, discount, total, currency, status, image URL/file ID, timestamps, and associated items. Inspect the exact schema before coding.

Statuses:
- `DRAFT`: uploaded/extracted/reviewable; not counted as confirmed revenue.
- `CONFIRMED`: explicitly approved by user.
- `CANCELLED`: cancelled, if supported by current API.

### InvoiceItem
Product name, quantity, unit price, total price, and invoice association. No separate Product entity. Item changes recalculate invoice subtotal/total on the backend.

### RawExtraction
Raw structured model output and metadata such as provider/model, prompt version, confidence/quality/validation information. Display only fields actually returned and safe for end users. Never expose internal stack traces/provider secrets.

### AITask
Persistent task status associated with invoice extraction (and potentially other task types).
Statuses: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`.
PostgreSQL is the durable status source; Redis Pub/Sub carries live events only.

### Conversation / Message
Persisted chat conversations and messages. Messages can have roles such as `USER`, `ASSISTANT`, `SYSTEM`, `TOOL`. Conversations belong to the authenticated user.

## 4. API integration inventory

### Authentication
Implemented features include registration, login, authenticated-user retrieval, refresh-token rotation, and logout/revocation. Exact paths, body schemas, token response shape, cookie behavior, and error codes must be discovered from backend source/OpenAPI.

Frontend requirements:
- Central API client.
- Attach access token as required by backend (normally `Authorization: Bearer ...`).
- Refresh flow must account for the HttpOnly refresh cookie and use `credentials: "include"` where required.
- Avoid storing sensitive refresh tokens in localStorage/sessionStorage.
- Handle expired access tokens without infinite refresh loops.
- Logout clears client auth state and calls backend revocation.
- Protect authenticated routes and redirect unauthenticated users.
- Verify CORS/credentials configuration for local development.

### Invoice endpoints
Implemented invoice CRUD, line-item CRUD, ownership checks, pagination, and filtering. Exact route names and schemas must be confirmed.

Known/implemented endpoint pattern:
- `GET /invoices/{invoice_id}` — fetch invoice and its items (verify exact response).
- Invoice list — pagination and filters; verify exact query names and defaults.
- Invoice create/upload — image upload creates a draft and task; verify multipart field name, response, and idempotency requirements.
- Invoice update/delete — verify supported status restrictions.
- Invoice item create/update/delete — verify exact paths and whether draft-only restrictions apply.

Supported list filters (verify exact parameter names):
- Status
- Customer name
- Date range
- Amount range
- Pagination

### Invoice review — implemented
- `GET /invoices/{invoice_id}/review`
  - Returns invoice plus latest extraction review information.
  - Draft-only review behavior is enforced.
- `PATCH /invoices/{invoice_id}/review`
  - Edit invoice-level fields, e.g. invoice number/date, customer name/phone, subtotal, tax, discount, total amount.
  - Only explicitly supplied fields are updated.
  - Backend validates non-negative monetary fields.
- `POST /invoices/{invoice_id}/review/items`
  - Add a line item during draft review.
  - Input fields include product name, quantity (>0), unit price (>=0), total price (>=0).
  - Backend validates item total equals quantity × unit price.
- `PATCH /invoices/{invoice_id}/review/items/{item_id}`
  - Edit a draft line item.
  - Backend recalculates line total from quantity × unit price and recalculates invoice subtotal.
- `DELETE /invoices/{invoice_id}/review/items/{item_id}`
  - Delete a draft line item and recalculate totals.

**Confirm endpoint:** Explicit invoice confirmation exists in the project workflow, but confirm the exact endpoint/method/body and validation response from backend source before integrating.

Frontend review UX:
- Show source invoice image and extracted data together.
- Editable invoice-level fields.
- Editable line-item table: add, edit, delete.
- Recalculate display previews if useful, but backend remains authoritative; use returned updated invoice.
- Save edits with PATCH operations. Avoid pretending unsaved edits were persisted.
- Confirm is a deliberate action with a confirmation dialog.
- Clearly show `Draft`, `Processing`, `Needs review`, `Confirmed`, and failure states as applicable.
- Do not automatically confirm after extraction.

### AI task status and SSE — implemented
Known endpoints:
- `GET /tasks/{task_id}` — durable current task state.
- `GET /tasks/{task_id}/stream` — live SSE updates.

The stream is user-owned/authenticated. Redis Pub/Sub is transient. Reconnecting clients must recover status via REST first, then reconnect only if the task remains active.

**Authentication constraint:** Native `EventSource` cannot attach arbitrary bearer Authorization headers. Use a `fetch()`-based streaming SSE reader if the stream requires a bearer token. Do not put access tokens in query strings.

Frontend task flow:
1. Use upload response to capture invoice/task IDs.
2. Fetch durable task status.
3. If status is terminal, render terminal state immediately.
4. If `PENDING`/`PROCESSING`, open authenticated SSE stream.
5. Parse SSE frames safely (events can be split across network chunks).
6. Update UI on status changes.
7. On stream disconnect, fetch task status to recover truth; reconnect only if still active, with bounded retry/backoff.
8. Stop stream on terminal state and component unmount.
9. `COMPLETED`: fetch review/invoice data and move user into review.
10. `FAILED`: preserve draft and image; show useful safe error and a retry option only if backend supports retry. Do not invent retry endpoint.
11. Do not use polling as the default task progress mechanism.

Exact SSE event names, data JSON structure, and retry semantics must be read from backend code.

### Analytics
Implemented revenue summary and daily revenue analytics. Analytics include `CONFIRMED` invoices only. Values represent billed invoice totals, not necessarily cash received. Do not aggregate unlike currencies without conversion; current operation assumes INR.

Verify exact analytics routes and response shapes. Render empty states if user has no confirmed invoices.

### Chat/conversations — implemented
The app has a LangGraph agent and persisted chat/conversation data. Chat is streamed via SSE; use the backend's current route contract.

Frontend requirements:
- Conversation sidebar/list.
- Create/new conversation.
- Load conversation history.
- Send a message and stream the assistant response.
- Render incremental response text.
- Render tool activity/status only if the backend emits it.
- Persist/reload conversations through REST.
- Keep user and assistant messages distinct.
- Handle stream errors and interrupted generations.
- Abort the stream on navigation/unmount when appropriate, while understanding backend generation/persistence behavior.
- After an interrupted stream, reload persisted history; do not assume partial streamed text is saved.
- No WebSockets, no polling.

**Likely transport:** authenticated `fetch()` request returning an SSE stream (not browser EventSource), because the chat request is initiated with a POST/body and bearer authentication. Verify exact method, path, request schema, and event types.

### Error contract
Inspect backend exception handlers and response schemas. The UI must support at least:
- `400`: invalid request/business validation.
- `401`: unauthenticated/expired access token (attempt refresh once where appropriate).
- `403`: forbidden.
- `404`: resource not found.
- `409`: conflict/idempotency/state conflict.
- `413`: image too large.
- `422`: schema/field validation.
- `429`: rate limit/provider quota if surfaced.
- `5xx`/network: generic service failure.

Do not display raw stack traces, secrets, provider messages, or internal diagnostics. Use field-level validation where returned. AI-provider quota/outage should have a clear, non-blaming UI state; preserve user data and draft.

## 5. Core frontend features to implement

### Public
1. Landing page.
2. Register.
3. Login.
4. 404/not-found page.
5. Any legal/about pages only if scope requires them; do not invent backend features.

Landing-page structure:
- Navigation: logo, feature/how-it-works links, login/get-started.
- Hero: `Dukaan ka hisaab, simple.` and concise Hinglish value proposition.
- About/product explanation.
- Three feature sections in a vertical alternating layout:
  1. Bill upload — illustration left, text right.
  2. AI chat — text left, illustration right.
  3. Invoice history/view all — illustration left, text right.
- “How it works” three steps: Photo lo → Check karo → Poochho.
- Ending CTA.
- Keep timeline/feature snapshots area empty for now; user will supply them later.

### Authenticated app shell/navigation
The three core actions must be easy to switch between without forcing the user back to a home screen:
- **Upload bill**
- **AI chat**
- **View all bills**

Use a persistent app shell with clear navigation (desktop sidebar or compact top/side nav; mobile bottom nav or menu). After signup/login, a useful dashboard/home view can present these three as primary actions/cards, but navigation should remain persistent. Dashboard can show recent invoices and simple confirmed-invoice analytics only if the API supports it.

Suggested structure:
- `/app` — dashboard/quick actions.
- `/app/upload` — upload.
- `/app/invoices` — invoice list.
- `/app/invoices/:id` — invoice details/review depending on status.
- `/app/chat` — chat.
- `/app/chat/:conversationId` — conversation.
These are frontend route suggestions, not backend routes.

### Upload
- Image selection via file picker and drag/drop.
- Preview before upload.
- Validate accepted formats (JPEG, PNG, WebP) and 10 MB limit; backend validation remains authoritative.
- Upload progress if available from the browser upload request.
- Loading/processing state after upload.
- Task status via SSE.
- Success transition to invoice review.
- Failure state preserves draft/context and provides safe recovery.
- Duplicate/idempotency conflict state if backend returns one.

### Invoice review
- Original image viewer.
- Invoice fields form.
- Line-item table.
- Add/edit/delete line items.
- Save edits.
- Validation messages.
- Confirm invoice action with explicit confirmation.
- After confirmation, show status and navigate to detail/list.
- Display extraction diagnostics/confidence only if safe and actually available.

### Invoice history/list
- Search.
- Filters for status/customer/date/amount if supported.
- Pagination.
- Clear filters.
- Empty state with CTA to upload.
- Row/card shows invoice number/date/customer/total/status.
- Distinguish draft from confirmed.
- Clicking opens invoice details/review.
- Avoid implying invoices represent paid transactions.

### Invoice details
- Read-only confirmed invoice details.
- Original image.
- Items and totals.
- Status.
- Appropriate actions only if backend supports them.

### AI chat
- Chat-history sidebar.
- New chat.
- Message composer.
- Streamed assistant response.
- Loading/thinking and tool activity states if emitted.
- Error state when provider/API fails or quota is exhausted.
- Suggested example questions can be UI-only prompts, not promises of unsupported capabilities.
- Preserve and reload messages/conversations from backend.
- Render charts/tables only when backend response/data format supports it; don't fabricate analytics.

### Dashboard
- Primary feature launch cards for Upload, Chat, View all.
- Recent invoices.
- Revenue summary/daily revenue widgets only if corresponding API is confirmed.
- Analytics should be clearly labelled as confirmed invoice/billed totals.
- Useful first-use empty state.

## 6. UI state/error requirements

Create reusable states/components:
- Loading skeletons/spinners.
- Empty states.
- Inline validation.
- Error banners/toasts.
- Retry actions only where API supports retry.
- Not-found for invalid invoice/conversation IDs.
- 404 page for unknown frontend routes.
- Unauthorized/expired-session handling.
- Network/offline state.
- SSE reconnecting/stream-ended state.
- Upload failure.
- AI provider unavailable/quota exhausted.
- Extraction failed.
- Draft needs manual review.
- Conflict state.
- Confirm/cancel destructive-action dialogs.

Never lose a selected file or unsaved review edits unnecessarily. Confirm navigation away from dirty review state.

## 7. Design system direction

### Desired visual identity
Indian, friendly, distinctive, warm, playful through illustrations—not through excessive UI decoration.

Style reference: modern flat vector editorial illustration of relatable Indian shopkeepers/business owners in everyday shop settings. Simplified geometric characters, expressive poses, clean solid shapes, minimal shading, pale backgrounds, colorful characters/props.

### Palette
Warm-only UI accent system:
- Primary accent: mustard/golden yellow.
- Secondary accent: warm orange/burnt orange.
- Background: off-white/warm neutral.
- Main text: charcoal.
- Muted text: warm gray.
- UI chrome remains restrained. Illustrations can be colorful (teal, pink, orange, red, green as illustration-only colors), but avoid making the interface itself multicolor.

Avoid green as the main UI accent. Do not use gradients as a default.

### Layout and components
- Flat, minimalist, editorial.
- Generous whitespace.
- Thin dividers rather than thick card outlines.
- Buttons are crisp, squared/very subtly rounded—not pill-shaped.
- Avoid generic AI-SaaS aesthetics: excessive rounded cards, glassmorphism, gradients, glowing borders, purple/blue AI palette, overused floating blobs, generic robot mascots.
- Use typography, composition, and illustrations for personality.
- Keep interactions clear and practical for a small-business user.
- Responsive mobile-first layouts.
- Strong contrast and accessible focus states.
- Consistent spacing, typography, button, form, status, and table patterns.

### Landing-page visual structure
A previous prototype established this direction:
- Header with wordmark, links, and a simple CTA.
- Hero: left copy, right flat vector Indian shopkeeper illustration.
- Feature section with heading and three **vertical alternating image/text rows**, not cards in a grid:
  1. illustration left / text right,
  2. text left / illustration right,
  3. illustration left / text right.
- How-it-works strip with 3 steps.
- Warm yellow/orange final CTA section with illustration.
- Responsive: alternating rows stack sensibly on mobile.

## 8. Technical implementation requirements

- Use the existing React/Tailwind setup; first inspect the project structure, installed packages, routing, and existing code.
- Do not replace or reinitialize the app.
- Prefer a clear feature-based structure and reusable components.
- Use React Router only if already installed; otherwise propose/install only after plan approval.
- Centralize API base URL in environment config.
- Centralize API client, auth/session handling, error normalization, and SSE utilities.
- Keep backend request/response types documented (TypeScript types if project uses TS).
- Do not place secrets in frontend environment variables; only public API base URL is allowed.
- Use an appropriate state-management approach based on current dependencies; avoid introducing unnecessary packages.
- Handle loading, empty, error, and success states for every major API interaction.
- Use cancellation/cleanup for streams and requests.
- No polling and no WebSockets.
- Do not fake backend data in production UI. Mock data may be used only for isolated design previews and must be clearly separated and removed/disabled in integrated screens.
- Do not add unsupported features such as forgot-password unless backend has it.
- Do not build payments, subscriptions, product catalog, multi-tenant organization management, or unrelated functionality unless the backend supports it and the user explicitly approves.
- Avoid large component files; maintain readable structure.
- Keep accessibility in mind: semantic elements, keyboard navigation, labels, focus states, and reduced motion.
- Keep animations subtle and purposeful.

## 9. API discovery before implementation

Before coding API integration:
1. Inspect backend route files and API router registration.
2. Inspect schemas for request/response contracts.
3. Inspect authentication dependency and token/cookie behavior.
4. Inspect upload route and task creation response.
5. Inspect task SSE event names and payloads.
6. Inspect chat SSE route/event format and persisted message behavior.
7. Inspect review/edit/add/delete/confirm endpoints.
8. Inspect invoice list query parameters and pagination.
9. Inspect analytics routes.
10. Inspect exception handlers and status codes.
11. Generate a verified endpoint matrix in the frontend's own README with route, method, request, response, auth, and event schema.

Where the backend contract differs from this document, use the actual backend. Flag mismatches before coding.

## 10. Definition of done

- All routes/pages work and are responsive.
- Authenticated routes are protected.
- User can upload image, track task through SSE, review/edit invoice, and confirm.
- User can navigate between Upload, Chat, and Invoice History from anywhere inside the authenticated app.
- Invoice history filters/pagination work with backend.
- Chat conversations load, persist, and stream.
- Analytics only show supported data.
- Error handling covers network, auth, not-found, validation, conflict, provider failure/quota, extraction failure, and SSE interruption.
- 404 page exists.
- No WebSockets or polling.
- No fake API features.
- Frontend README includes actual implementation plan, architecture, route map, component tree, API contract, state strategy, SSE strategy, milestones, risks, and tests.
- Before implementation, produce the requested plan README and wait for review/approval.
