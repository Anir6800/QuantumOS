from fastapi import APIRouter, status
from typing import List
from schemas import SessionCreate, SessionResponse, SessionStatusUpdate
from services.session_service import session_service

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])

@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(session: SessionCreate):
    return await session_service.create_session(session)

@router.get("", response_model=List[SessionResponse], status_code=status.HTTP_200_OK)
async def list_sessions():
    return await session_service.list_sessions()

@router.get("/{session_id}", response_model=SessionResponse, status_code=status.HTTP_200_OK)
async def get_session(session_id: str):
    return await session_service.get_session(session_id)

@router.patch("/{session_id}/status", response_model=SessionResponse, status_code=status.HTTP_200_OK)
async def update_session_status(session_id: str, update_data: SessionStatusUpdate):
    return await session_service.update_status(session_id, update_data)
