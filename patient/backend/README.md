# Patient MediBot Backend

This is the canonical FastAPI backend for the MediBot UI mounted in
`patient/ui`. It is intentionally separate from the Node/Mongoose application
server in `lab/server` because the assistant uses Python AI SDKs.

## Run locally

From this directory:

```bash
python -m venv .venv
python -m pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The local `.env` must contain a valid `GROQ_API_KEY` or `GEMINI_API_KEY` for
chat requests. It is ignored by git and must never be committed.

## API

- `GET /` — service information
- `GET /api/v1/health` — health check
- `POST /api/v1/chat` — accepts `{ "question": "...", "history": [] }`

Successful chat responses have the shape:

```json
{
  "success": true,
  "message": "Response generated successfully.",
  "data": { "question": "...", "answer": "..." }
}
```
