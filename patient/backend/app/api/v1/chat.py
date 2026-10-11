from fastapi import APIRouter, HTTPException

from app.schemas.chat_schema import ChatRequest
from app.schemas.response_schema import ApiResponse
from app.services.groq_service import groq_service


router = APIRouter()


@router.post("/chat", response_model=ApiResponse)
def chat(request: ChatRequest):
    try:
        answer = groq_service.generate_response(request.question, request.history)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    return ApiResponse(
        success=True,
        message="Response generated successfully.",
        data={
            "question": request.question,
            "answer": answer,
        },
    )
