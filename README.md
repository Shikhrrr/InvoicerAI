# InvoicerAI

AI-powered invoice digitization, human-in-the-loop verification, and business insights application for Indian shopkeepers.

## Project Structure

```
invoicerAI/
├── backend/            # FastAPI, PostgreSQL, Async SQLAlchemy, LangGraph, Celery, Redis, ImageKit
└── frontend/           # React 18, TypeScript, Tailwind CSS, Vite
```

For complete details on the frontend architecture, components, and API integration, see [FRONTEND_README.md](file:///Users/shikhar/Desktop/langchain/invoicerAI/frontend/FRONTEND_README.md).

## Quick Start

### 1. Backend
Ensure PostgreSQL and Redis are running, then start the FastAPI server:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend
You can run it from the root or inside the `frontend` folder:
```bash
# Option A: From root
npm run dev

# Option B: From frontend directory
cd frontend
npm run dev
```
The app will be available at `http://localhost:5173` (or `http://localhost:5174`).
