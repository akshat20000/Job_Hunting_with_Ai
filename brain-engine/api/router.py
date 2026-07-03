from fastapi import APIRouter
from api.v1.evaluate import router as evaluate_router
from api.v1.generate import router as generate_router
from api.v1.health import router as health_router

api_router = APIRouter()

api_router.include_router(evaluate_router, prefix="/api/v1", tags=["evaluate"])
api_router.include_router(generate_router, prefix="/api/v1", tags=["generate"])
api_router.include_router(health_router, prefix="/api/v1", tags=["health"])
