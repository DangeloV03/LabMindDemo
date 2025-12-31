from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os
from supabase import create_client, Client
from datetime import datetime
import uuid

# Import Gemini service
try:
    from services.gemini_service import GeminiService
    gemini_service = GeminiService()
except Exception as e:
    print(f"Warning: Could not initialize GeminiService: {e}")
    gemini_service = None

app = FastAPI(title="LabMind API", version="0.1.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role key for backend

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

supabase: Client = create_client(supabase_url, supabase_key)

# Security
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Verify JWT token and return user"""
    try:
        token = credentials.credentials
        # Verify token with Supabase
        response = supabase.auth.get_user(token)
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
        return response.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )


# Pydantic models
class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    quiz_responses: Optional[dict] = None
    status: str = "draft"


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    quiz_responses: Optional[dict] = None
    status: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    quiz_responses: Optional[dict]
    status: str
    created_at: str
    updated_at: str


class NotebookCreate(BaseModel):
    cells: List[dict]


class NotebookUpdate(BaseModel):
    cells: Optional[List[dict]] = None
    metadata: Optional[dict] = None


class NotebookResponse(BaseModel):
    id: str
    project_id: str
    cells: List[dict]
    metadata: Optional[dict]
    created_at: str
    updated_at: str


class FileResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    name: str
    path: str
    size: int
    mime_type: Optional[str]
    created_at: str


class AgentStep(BaseModel):
    step_number: int
    title: str
    description: str
    code: str
    dependencies: List[int] = []


class AgentSessionCreate(BaseModel):
    steps: List[dict]


class AgentSessionUpdate(BaseModel):
    steps: Optional[List[dict]] = None
    current_step: Optional[int] = None
    status: Optional[str] = None
    conversation_history: Optional[List[dict]] = None
    metadata: Optional[dict] = None


class AgentSessionResponse(BaseModel):
    id: str
    project_id: str
    steps: List[dict]
    current_step: int
    status: str
    conversation_history: Optional[List[dict]]
    metadata: Optional[dict]
    created_at: str
    updated_at: str


class AgentChatRequest(BaseModel):
    message: str


class AgentChatResponse(BaseModel):
    response: str


# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok"}


# Projects endpoints
@app.get("/api/projects", response_model=List[ProjectResponse])
async def list_projects(current_user: dict = Depends(get_current_user)):
    """List all projects for the current user"""
    try:
        response = (
            supabase.table("projects")
            .select("*")
            .eq("user_id", current_user["id"])
            .order("created_at", desc=True)
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching projects: {str(e)}",
        )


@app.post("/api/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate, current_user: dict = Depends(get_current_user)
):
    """Create a new project"""
    try:
        project_data = {
            "user_id": current_user["id"],
            "title": project.title,
            "description": project.description,
            "quiz_responses": project.quiz_responses,
            "status": project.status,
        }
        response = supabase.table("projects").insert(project_data).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create project",
            )
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating project: {str(e)}",
        )


@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str, current_user: dict = Depends(get_current_user)
):
    """Get a specific project"""
    try:
        response = (
            supabase.table("projects")
            .select("*")
            .eq("id", project_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching project: {str(e)}",
        )


@app.put("/api/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update a project"""
    try:
        # Verify ownership
        existing = (
            supabase.table("projects")
            .select("*")
            .eq("id", project_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        # Update only provided fields
        update_data = project_update.dict(exclude_unset=True)
        response = (
            supabase.table("projects")
            .update(update_data)
            .eq("id", project_id)
            .eq("user_id", current_user["id"])
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update project"
            )
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating project: {str(e)}",
        )


@app.delete("/api/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str, current_user: dict = Depends(get_current_user)
):
    """Delete a project"""
    try:
        # Verify ownership and delete
        response = (
            supabase.table("projects")
            .delete()
            .eq("id", project_id)
            .eq("user_id", current_user["id"])
            .execute()
        )
        # Supabase delete returns empty array on success
        return None
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting project: {str(e)}",
        )


# Notebook endpoints
@app.get("/api/projects/{project_id}/notebook", response_model=NotebookResponse)
async def get_notebook(
    project_id: str, current_user: dict = Depends(get_current_user)
):
    """Get notebook for a project"""
    try:
        # Verify project ownership
        project = (
            supabase.table("projects")
            .select("*")
            .eq("id", project_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
        if not project.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        # Get notebook
        response = (
            supabase.table("notebooks")
            .select("*")
            .eq("project_id", project_id)
            .maybe_single()
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Notebook not found"
            )
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching notebook: {str(e)}",
        )


@app.post("/api/projects/{project_id}/notebook", response_model=NotebookResponse, status_code=status.HTTP_201_CREATED)
async def create_notebook(
    project_id: str,
    notebook: NotebookCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a notebook for a project"""
    try:
        # Verify project ownership
        project = (
            supabase.table("projects")
            .select("*")
            .eq("id", project_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
        if not project.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        notebook_data = {
            "project_id": project_id,
            "cells": notebook.cells,
        }
        response = supabase.table("notebooks").insert(notebook_data).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create notebook",
            )
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating notebook: {str(e)}",
        )


@app.put("/api/projects/{project_id}/notebook", response_model=NotebookResponse)
async def update_notebook(
    project_id: str,
    notebook_update: NotebookUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update a notebook"""
    try:
        # Verify project ownership
        project = (
            supabase.table("projects")
            .select("*")
            .eq("id", project_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
        if not project.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        # Update notebook
        update_data = notebook_update.dict(exclude_unset=True)
        response = (
            supabase.table("notebooks")
            .update(update_data)
            .eq("project_id", project_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Notebook not found"
            )
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating notebook: {str(e)}",
        )


# File endpoints
@app.get("/api/projects/{project_id}/files", response_model=List[FileResponse])
async def list_files(
    project_id: str, current_user: dict = Depends(get_current_user)
):
    """List files for a project"""
    try:
        # Verify project ownership
        project = (
            supabase.table("projects")
            .select("*")
            .eq("id", project_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
        if not project.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        response = (
            supabase.table("files")
            .select("*")
            .eq("project_id", project_id)
            .order("created_at", desc=True)
            .execute()
        )
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching files: {str(e)}",
        )


@app.delete("/api/projects/{project_id}/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    project_id: str,
    file_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a file"""
    try:
        # Verify project ownership and file ownership
        file_record = (
            supabase.table("files")
            .select("*, projects!inner(user_id)")
            .eq("id", file_id)
            .eq("project_id", project_id)
            .single()
            .execute()
        )
        if not file_record.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="File not found"
            )

        # Delete from storage
        supabase.storage.from_("project-files").remove([file_record.data["path"]])

        # Delete from database
        supabase.table("files").delete().eq("id", file_id).execute()

        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting file: {str(e)}",
        )


# Agent endpoints
@app.post("/api/projects/{project_id}/agent/analyze", response_model=AgentSessionResponse, status_code=status.HTTP_201_CREATED)
async def analyze_research_goal(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Analyze quiz responses and create agent session with steps"""
    try:
        if not gemini_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini service is not available",
            )

        # Verify project ownership
        project = (
            supabase.table("projects")
            .select("*")
            .eq("id", project_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
        if not project.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        quiz_responses = project.data.get("quiz_responses")
        if not quiz_responses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quiz responses not found. Please complete the quiz first.",
            )

        # Generate steps using Gemini
        steps = gemini_service.analyze_research_goal(quiz_responses)

        # Create or update agent session
        session_data = {
            "project_id": project_id,
            "steps": steps,
            "current_step": 0,
            "status": "planning",
            "conversation_history": [],
        }

        response = (
            supabase.table("agent_sessions")
            .upsert(session_data, on_conflict="project_id")
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create agent session",
            )

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing research goal: {str(e)}",
        )


@app.get("/api/projects/{project_id}/agent", response_model=AgentSessionResponse)
async def get_agent_session(
    project_id: str, current_user: dict = Depends(get_current_user)
):
    """Get agent session for a project"""
    try:
        # Verify project ownership
        project = (
            supabase.table("projects")
            .select("*")
            .eq("id", project_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
        if not project.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        # Get agent session
        response = (
            supabase.table("agent_sessions")
            .select("*")
            .eq("project_id", project_id)
            .maybe_single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Agent session not found"
            )

        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching agent session: {str(e)}",
        )


@app.put("/api/projects/{project_id}/agent/steps", response_model=AgentSessionResponse)
async def update_agent_steps(
    project_id: str,
    update: AgentSessionUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update agent session steps"""
    try:
        # Verify project ownership
        project = (
            supabase.table("projects")
            .select("*")
            .eq("id", project_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
        if not project.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        # Update agent session
        update_data = update.dict(exclude_unset=True)
        response = (
            supabase.table("agent_sessions")
            .update(update_data)
            .eq("project_id", project_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Agent session not found"
            )

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating agent session: {str(e)}",
        )


@app.post("/api/projects/{project_id}/agent/chat", response_model=AgentChatResponse)
async def chat_with_agent(
    project_id: str,
    chat_request: AgentChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """Chat with the AI agent"""
    try:
        if not gemini_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini service is not available",
            )

        # Verify project ownership
        project = (
            supabase.table("projects")
            .select("*")
            .eq("id", project_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
        if not project.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        # Get agent session
        session_response = (
            supabase.table("agent_sessions")
            .select("*")
            .eq("project_id", project_id)
            .maybe_single()
            .execute()
        )

        if not session_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent session not found. Please analyze your research goal first.",
            )

        session = session_response.data
        steps = session.get("steps", [])
        conversation_history = session.get("conversation_history", [])

        # Get AI response
        ai_response = gemini_service.chat_with_agent(
            chat_request.message, conversation_history, steps
        )

        # Update conversation history
        new_history = conversation_history + [
            {"role": "user", "content": chat_request.message},
            {"role": "assistant", "content": ai_response},
        ]

        # Update session with new conversation history
        supabase.table("agent_sessions").update(
            {"conversation_history": new_history}
        ).eq("project_id", project_id).execute()

        return AgentChatResponse(response=ai_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in agent chat: {str(e)}",
        )


@app.post("/api/projects/{project_id}/agent/execute/{step_index}", response_model=AgentSessionResponse)
async def execute_agent_step(
    project_id: str,
    step_index: int,
    current_user: dict = Depends(get_current_user),
):
    """Execute a specific agent step"""
    try:
        # Verify project ownership
        project = (
            supabase.table("projects")
            .select("*")
            .eq("id", project_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
        if not project.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        # Get agent session
        session_response = (
            supabase.table("agent_sessions")
            .select("*")
            .eq("project_id", project_id)
            .maybe_single()
            .execute()
        )

        if not session_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Agent session not found"
            )

        session = session_response.data
        steps = session.get("steps", [])

        if step_index < 0 or step_index >= len(steps):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid step index"
            )

        # Update session status and current step
        update_data = {
            "current_step": step_index,
            "status": "executing",
        }

        response = (
            supabase.table("agent_sessions")
            .update(update_data)
            .eq("project_id", project_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update agent session",
            )

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing agent step: {str(e)}",
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)