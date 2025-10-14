# SAIL Rake Optimization - SIH Project

Full-stack app: Next.js frontend + FastAPI backend.

Run instructions (after installing dependencies):
- Frontend: cd frontend; npm install; npm run dev
- Backend: cd backend; python -m venv .venv; .venv\Scripts\activate; pip install -r requirements.txt; uvicorn main:app --reload --port 8000

Architecture:
- frontend/: Next.js + Tailwind UI
- backend/: FastAPI endpoints, optimizer, ML forecast modules

## Gemini Optimizer

The `/optimize` API delegates plan generation to Google Gemini (Generative Language API). Configure these environment variables before starting the backend:

- `GEMINI_API_KEY` – required. API key with access to the Gemini model you want to use.
- `GEMINI_MODEL` – optional. Defaults to `gemini-2.0-flash`. Change this if your key supports a different model (e.g. `gemini-1.5-pro-latest`).
- `GEMINI_API_VERSION` – optional. Defaults to `v1beta`. Override if Google enables the model on a different API version.

FastAPI will prompt Gemini with the optimization datasets and expects a JSON-only response containing `plan`, `totals`, `cost_by_destination`, `utilization`, `dispatch_schedule`, `matrix`, `suggestions`, and `unfulfilled_orders`.

See docs/ for API schema and sample dataset.