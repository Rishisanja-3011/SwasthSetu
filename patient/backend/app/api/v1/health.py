from fastapi import APIRouter


router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "MediBot Backend is running successfully",
    }
