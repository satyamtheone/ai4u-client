from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import structlog

from core.config import settings
from core.logging import setup_logging
from core.database import engine, SessionLocal
from core.role_init import init_system_roles, ensure_roles_exist
from api.v1.router import api_router
from middleware.request_logging import RequestLoggingMiddleware
from middleware.rate_limiting import RateLimitingMiddleware

# Setup logging
setup_logging()
logger = structlog.get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    logger.info("Starting application", environment=settings.ENVIRONMENT)

    # Initialize system roles on startup
    try:
        db = SessionLocal()
        logger.info("Initializing system roles...")
        init_system_roles(db)

        # Verify all roles exist
        if ensure_roles_exist(db):
            logger.info("System roles verified successfully")
        else:
            logger.warning("Some system roles may be missing")

        db.close()
    except Exception as e:
        logger.error("Failed to initialize system roles", error=str(e))

    yield
    logger.info("Shutting down application")

app = FastAPI(
    title="Multi-Tenancy API",
    description="Mission-critical multi-tenancy application with SSO support",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.ENVIRONMENT == "development" else ["yourdomain.com"]
)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitingMiddleware)

# Include routers
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "environment": settings.ENVIRONMENT}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Multi-Tenancy API is running"}
