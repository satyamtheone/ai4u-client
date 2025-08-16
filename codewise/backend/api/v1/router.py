from fastapi import APIRouter
from api.v1.endpoints import auth, users, organizations, health, learning, admin

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(learning.router, prefix="/learning", tags=["learning"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])