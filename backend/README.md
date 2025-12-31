# LabMind Backend API

FastAPI backend for LabMind platform.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
- Copy `.env.example` to `.env`
- Fill in your Supabase credentials

4. Run the development server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at http://localhost:8000

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

All endpoints require authentication via Bearer token (JWT from Supabase).

## Environment Variables

Create a `.env` file in the `backend/` directory with:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for backend operations)
- `GEMINI_API_KEY` - Google Gemini API key (required for AI agent features)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins (e.g., `http://localhost:3000,https://your-app.vercel.app`)

See `../ENV_SETUP.md` for detailed setup instructions including production deployment.

## AI Agent Features

The backend includes AI agent endpoints that use Google Gemini API:
- `POST /api/projects/{project_id}/agent/analyze` - Analyze quiz responses and generate research plan
- `GET /api/projects/{project_id}/agent` - Get agent session
- `PUT /api/projects/{project_id}/agent/steps` - Update agent steps
- `POST /api/projects/{project_id}/agent/execute/{step_index}` - Execute a step
- `POST /api/projects/{project_id}/agent/chat` - Chat with the AI agent
