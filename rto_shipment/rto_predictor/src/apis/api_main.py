"""
FastAPI Application for RTO Prediction Service
Production-ready REST API with comprehensive endpoints
"""

# Add project root to path first, before any other imports
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, Query, Path as PathParam
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import List, Dict, Any, Optional, Union
from enum import Enum
import pandas as pd
import json
import os
import tempfile
import uvicorn
from datetime import datetime
import logging
from pathlib import Path as FilePath
import traceback
import asyncio

# Import the production pipeline
from src.main import ProductionRTOPipelineManager, ProductionRTOPredictor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class PaymentModeEnum(str, Enum):
    """Payment mode enumeration"""
    COD = "COD"
    PREPAID = "PREPAID"
    PARTIAL_COD = "PARTIAL_COD"


class RiskLevelEnum(str, Enum):
    """Risk level enumeration"""
    VERY_LOW = "Very Low"
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    VERY_HIGH = "Very High"


class OrderInput(BaseModel):
    """Single order input model"""
    ORDER_NUMBER: str = Field(..., description="Unique order number", min_length=1)
    CLIENT_NAME: Optional[str] = Field(None, description="Client name")
    CUSTOMER_NAME: str = Field(..., description="Customer name")
    CUSTOMER_PHONE: str = Field(..., description="Customer phone number", min_length=10, max_length=15)
    CUSTOMER_ADDRESS: str = Field(..., description="Customer delivery address", min_length=10)
    CUSTOMER_CITY: str = Field(..., description="City name")
    CUSTOMER_STATE: str = Field(..., description="State name")
    PINCODE: str = Field(..., description="6-digit pincode", pattern=r"^\d{6}$")
    PAYMENT_MODE: str = Field(..., description="Payment mode (COD/PREPAID)")
    COURIER_NAME: str = Field(..., description="Courier partner name")
    ITEM_DESCRIPTION: Optional[str] = Field(None, description="Product description")
    WEIGHT: float = Field(..., description="Package weight in kg", gt=0)
    QTY: int = Field(..., description="Quantity of items", gt=0)
    INVOICE_VALUE: float = Field(..., description="Order value", ge=0)
    ORDER_CREATION_DATE: Optional[str] = Field(None, description="Order creation timestamp")
    COLLECTABLE_AMOUNT: Optional[float] = Field(None, description="COD amount", ge=0)
    EDD: Optional[str] = Field(None, description="Expected delivery date")
    ZONE: Optional[str] = Field(None, description="Delivery zone")
    CURRENT_STATUS: Optional[str] = Field(None, description="Current order status (for training)")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "ORDER_NUMBER": "ORD123456",
                "CLIENT_NAME": "ABC Corp",
                "CUSTOMER_NAME": "John Doe",
                "CUSTOMER_PHONE": "9876543210",
                "CUSTOMER_ADDRESS": "123 Main St, Sector 15, Near Metro Station",
                "CUSTOMER_CITY": "GURGAON",
                "CUSTOMER_STATE": "HARYANA",
                "PINCODE": "122001",
                "PAYMENT_MODE": "COD",
                "COURIER_NAME": "DELHIVERY",
                "ITEM_DESCRIPTION": "Electronics - Mobile Phone",
                "WEIGHT": 1.5,
                "QTY": 2,
                "INVOICE_VALUE": 2499.50,
                "ORDER_CREATION_DATE": "2025-07-22T09:00:00Z",
                "COLLECTABLE_AMOUNT": 2499.50,
                "ZONE": "North"
            }
        }
    )


class BatchPredictionRequest(BaseModel):
    """Batch prediction request"""
    orders: List[OrderInput] = Field(..., min_items=1, max_items=1000, description="List of orders")
    batch_size: Optional[int] = Field(None, description="Batch processing size", ge=100, le=10000)
    validate_predictions: bool = Field(False, description="Validate predictions if actual outcomes available")

    @field_validator('orders')
    @classmethod
    def validate_unique_orders(cls, v):
        order_numbers = [order.ORDER_NUMBER for order in v]
        if len(order_numbers) != len(set(order_numbers)):
            raise ValueError("Duplicate order numbers found in batch")
        return v


class PredictionResponse(BaseModel):
    """Single prediction response"""
    order_index: int
    order_number: str
    rto_prediction: bool
    rto_probability: float
    risk_level: str
    confidence: Optional[float] = None
    explanation: Optional[str] = None
    risk_factors: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    similar_orders: Optional[List[Dict]] = None
    courier_performance: Optional[Dict] = None
    pincode_stats: Optional[Dict] = None
    prediction_timestamp: str


class BatchPredictionResponse(BaseModel):
    """Batch prediction response"""
    predictions: List[Dict]
    summary: Dict[str, Any]
    processing_time_seconds: float
    timestamp: str
    total_orders: int
    successful_predictions: int
    failed_predictions: int


class TrainingRequest(BaseModel):
    """Model training request"""
    description: Optional[str] = Field(None, description="Training job description")
    notification_email: Optional[str] = Field(None, description="Email for training completion notification")


class TrainingResponse(BaseModel):
    """Training response"""
    job_id: str
    status: str
    message: str
    timestamp: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    model_status: str
    timestamp: str
    version: str
    uptime_seconds: Optional[float] = None


class SystemMetricsResponse(BaseModel):
    """System metrics response"""
    memory_usage_mb: float
    cpu_percent: float
    disk_usage_percent: Optional[float] = None
    predictions_count: int
    error_count: int
    circuit_breaker_state: str
    timestamp: str


class CourierPerformanceResponse(BaseModel):
    """Courier performance response"""
    courier_performance: Dict[str, Any]
    timestamp: str


class PincodeAnalysisRequest(BaseModel):
    """Pincode analysis request"""
    pincode: Optional[str] = Field(None, description="Specific pincode (6 digits)", pattern=r"^\d{6}$")
    top_k: int = Field(10, description="Number of top pincodes to return", ge=1, le=100)


class PerformanceReportResponse(BaseModel):
    """Performance report response"""
    report: Dict[str, Any]
    timestamp: str


class BackupResponse(BaseModel):
    """Backup operation response"""
    success: bool
    backup_path: Optional[str] = None
    message: str
    timestamp: str


class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    detail: Optional[str] = None
    timestamp: str
    request_id: Optional[str] = None


# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

# Initialize FastAPI app
app = FastAPI(
    title="RTO Prediction API",
    description="Production-ready API for Return-to-Origin (RTO) prediction in e-commerce shipments",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Add middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
pipeline_manager: Optional[ProductionRTOPipelineManager] = None
start_time = datetime.now()
prediction_count = 0
error_count = 0

# ============================================================================
# STARTUP AND SHUTDOWN EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize the API on startup"""
    global pipeline_manager

    logger.info("Starting RTO Prediction API v2.0...")

    try:
        # Initialize pipeline manager
        logger.info("Initializing ProductionRTOPipelineManager...")
        pipeline_manager = ProductionRTOPipelineManager()

        # Try to load existing model
        try:
            pipeline_manager.predictor.load_model_snapshot()
            logger.info("✓ Loaded existing model snapshot successfully")
        except Exception as e:
            logger.warning(f"No existing model found: {e}")
            logger.info("API ready, but model needs to be trained first")

        # Perform health check
        health = pipeline_manager.health_check()
        logger.info(f"System health: {health['overall_status']}")

        logger.info("✓ RTO Prediction API started successfully")

    except Exception as e:
        logger.error(f"Failed to initialize API: {e}")
        logger.error(traceback.format_exc())
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down RTO Prediction API...")

    # Perform any cleanup
    global pipeline_manager
    if pipeline_manager:
        try:
            # Create final backup
            pipeline_manager.create_backup()
            logger.info("✓ Final backup created")
        except Exception as e:
            logger.warning(f"Failed to create final backup: {e}")

    logger.info("✓ API shutdown complete")


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    global error_count
    error_count += 1

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "timestamp": datetime.now().isoformat(),
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    global error_count
    error_count += 1

    logger.error(f"Unhandled exception: {exc}")
    logger.error(traceback.format_exc())

    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "timestamp": datetime.now().isoformat()
        }
    )


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def check_model_loaded():
    """Check if model is loaded"""
    if pipeline_manager is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")

    if pipeline_manager.predictor.model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please train the model first using POST /api/v1/train"
        )


def save_temp_csv(file_content: bytes, suffix: str = '.csv') -> str:
    """Save uploaded file to temporary location"""
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix, mode='wb') as tmp_file:
        tmp_file.write(file_content)
        return tmp_file.name


# ============================================================================
# ROOT AND INFO ENDPOINTS
# ============================================================================

@app.get("/", tags=["Info"])
async def root():
    """Root endpoint with API information"""
    global prediction_count, error_count

    uptime = (datetime.now() - start_time).total_seconds()

    return {
        "service": "RTO Prediction API",
        "version": "2.0.0",
        "status": "running",
        "model_loaded": pipeline_manager.predictor.model is not None if pipeline_manager else False,
        "uptime_seconds": uptime,
        "predictions_made": prediction_count,
        "errors": error_count,
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "docs": "/docs",
            "health": "/api/v1/health",
            "predict": "/api/v1/predict",
            "train": "/api/v1/train"
        }
    }


@app.get("/api/v1/info", tags=["Info"], response_model=Dict[str, Any])
async def api_info():
    """Get detailed API information"""
    return {
        "api_version": "2.0.0",
        "service_name": "RTO Prediction Service",
        "description": "ML-powered Return-to-Origin prediction for e-commerce",
        "features": [
            "Single order prediction",
            "Batch prediction (up to 1000 orders)",
            "CSV file upload prediction",
            "Model training and retraining",
            "Performance analytics",
            "Courier performance analysis",
            "Geographic risk analysis",
            "Health monitoring",
            "Automated backups"
        ],
        "supported_formats": ["JSON", "CSV"],
        "max_batch_size": 1000,
        "model_types": ["RandomForest", "GradientBoosting", "LogisticRegression"],
        "timestamp": datetime.now().isoformat()
    }


# ============================================================================
# HEALTH AND MONITORING ENDPOINTS
# ============================================================================

@app.get("/health", tags=["Health"], response_model=Dict[str, Any])
@app.get("/api/v1/health", tags=["Health"], response_model=Dict[str, Any])
async def health_check():
    """Comprehensive health check endpoint"""
    try:
        if pipeline_manager is None:
            return {
                "status": "unhealthy",
                "model_loaded": False,
                "model_status": "not_initialized",
                "timestamp": datetime.now().isoformat(),
                "version": "2.0.0"
            }

        health_status = pipeline_manager.health_check()

        return {
            "status": health_status.get('overall_status', 'unknown'),
            "model_loaded": health_status.get('model_loaded', False),
            "model_status": "active" if health_status.get('model_loaded') else "inactive",
            "timestamp": datetime.now().isoformat(),
            "version": "2.0.0",
            "details": health_status
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@app.get("/api/v1/metrics", tags=["Health"], response_model=Dict[str, Any])
async def get_system_metrics():
    """Get detailed system metrics"""
    try:
        if pipeline_manager is None:
            raise HTTPException(status_code=503, detail="Pipeline not initialized")

        metrics = pipeline_manager.get_system_metrics()

        global prediction_count, error_count
        uptime = (datetime.now() - start_time).total_seconds()

        return {
            **metrics,
            "api_metrics": {
                "uptime_seconds": uptime,
                "total_predictions": prediction_count,
                "total_errors": error_count,
                "error_rate": error_count / max(prediction_count, 1) * 100
            },
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to get metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/status", tags=["Health"])
async def get_status():
    """Get current system status"""
    try:
        if pipeline_manager is None:
            return {
                "pipeline_initialized": False,
                "model_loaded": False,
                "status": "not_ready"
            }

        return {
            "pipeline_initialized": True,
            "model_loaded": pipeline_manager.predictor.model is not None,
            "status": "ready" if pipeline_manager.predictor.model is not None else "waiting_for_training",
            "health_status": pipeline_manager.predictor.get_health_status(),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to get status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# PREDICTION ENDPOINTS
# ============================================================================

@app.post("/api/v1/predict", tags=["Prediction"], response_model=Dict[str, Any])
async def predict_single_order(order: OrderInput):
    """
    Predict RTO probability for a single order

    Returns:
    - rto_prediction: Boolean indicating RTO risk
    - rto_probability: Float between 0 and 1
    - risk_level: Risk category (Very Low, Low, Medium, High, Very High)
    - recommendations: List of actionable recommendations
    """
    global prediction_count

    try:
        check_model_loaded()

        # Convert to DataFrame
        df = pd.DataFrame([order.dict()])

        # Make prediction
        logger.info(f"Predicting for order: {order.ORDER_NUMBER}")
        results = pipeline_manager.predictor.predict(df)

        if results['predictions']:
            prediction_count += 1
            return {
                **results['predictions'][0],
                "processing_time_ms": results.get('processing_time_ms', 0),
                "model_version": results.get('model_version', 'unknown')
            }
        else:
            raise HTTPException(status_code=500, detail="Prediction generation failed")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/api/v1/predict/batch", tags=["Prediction"], response_model=Dict[str, Any])
async def predict_batch_orders(request: BatchPredictionRequest):
    """
    Predict RTO probability for multiple orders (up to 1000)

    Returns batch predictions with summary statistics
    """
    global prediction_count

    try:
        check_model_loaded()

        if len(request.orders) > 1000:
            raise HTTPException(
                status_code=413,
                detail="Batch size too large. Maximum 1000 orders per request"
            )

        start_time_pred = datetime.now()

        # Convert to DataFrame
        orders_data = [order.dict() for order in request.orders]
        df = pd.DataFrame(orders_data)

        logger.info(f"Batch prediction for {len(df)} orders")

        # Make predictions
        results = pipeline_manager.predictor.predict(df)

        processing_time = (datetime.now() - start_time_pred).total_seconds()
        prediction_count += len(request.orders)

        return {
            "predictions": results['predictions'],
            "summary": results['summary'],
            "total_orders": len(request.orders),
            "successful_predictions": len(results['predictions']),
            "failed_predictions": len(request.orders) - len(results['predictions']),
            "processing_time_seconds": processing_time,
            "timestamp": datetime.now().isoformat(),
            "model_version": results.get('model_version', 'unknown')
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")


@app.post("/api/v1/predict/csv", tags=["Prediction"])
async def predict_from_csv(file: UploadFile = File(...)):
    """
    Upload CSV file for batch prediction

    CSV should contain columns:
    - ORDER_NUMBER, CUSTOMER_PHONE, CUSTOMER_ADDRESS, PAYMENT_MODE, COURIER_NAME, etc.
    """
    global prediction_count

    try:
        check_model_loaded()

        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=400,
                detail="File must be a CSV file"
            )

        # Read file content
        content = await file.read()
        tmp_file_path = save_temp_csv(content)

        try:
            logger.info(f"Processing CSV file: {file.filename}")

            # Process the CSV
            results = pipeline_manager.process_new_orders(tmp_file_path)

            prediction_count += len(results.get('predictions', []))

            return {
                "filename": file.filename,
                "results": results,
                "timestamp": datetime.now().isoformat()
            }

        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CSV prediction error: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"CSV prediction failed: {str(e)}")


# ============================================================================
# TRAINING AND MODEL MANAGEMENT ENDPOINTS
# ============================================================================

@app.post("/api/v1/train", tags=["Model Management"], response_model=Dict[str, Any])
async def train_model(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    description: Optional[str] = None
):
    """
    Train a new model with uploaded training data

    Training runs in background. Check /api/v1/health for model status.

    CSV must include CURRENT_STATUS column for target creation.
    """
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=400,
                detail="Training file must be a CSV"
            )

        # Read and save file
        content = await file.read()
        tmp_file_path = save_temp_csv(content)

        job_id = f"train_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Add training task to background
        background_tasks.add_task(
            train_model_task,
            tmp_file_path,
            job_id,
            description
        )

        return {
            "job_id": job_id,
            "status": "started",
            "message": "Model training started in background",
            "filename": file.filename,
            "description": description,
            "timestamp": datetime.now().isoformat(),
            "note": "Check /api/v1/health to monitor training progress"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Training initiation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def train_model_task(training_file_path: str, job_id: str, description: Optional[str]):
    """Background task for model training"""
    try:
        logger.info(f"Starting training job: {job_id}")

        if description:
            logger.info(f"Job description: {description}")

        # Train model
        results = pipeline_manager.train_initial_model(training_file_path)

        logger.info(f"✓ Training completed - Best model: {results.get('best_model', 'Unknown')}")
        logger.info(f"✓ Training accuracy: {results.get('test_accuracy', 0):.2%}")

        # Clean up temporary file
        if os.path.exists(training_file_path):
            os.unlink(training_file_path)

        return results

    except Exception as e:
        logger.error(f"Training job {job_id} failed: {e}")
        logger.error(traceback.format_exc())

        # Clean up on error
        if os.path.exists(training_file_path):
            os.unlink(training_file_path)

        raise


@app.post("/api/v1/retrain", tags=["Model Management"], response_model=Dict[str, Any])
async def retrain_model(
    background_tasks: BackgroundTasks,
    file: Optional[UploadFile] = File(None),
    description: Optional[str] = None
):
    """
    Retrain existing model with new data

    If file is provided, retrains with new data.
    If no file, checks if retraining is needed based on performance.
    """
    try:
        check_model_loaded()

        tmp_file_path = None

        if file:
            if not file.filename.endswith('.csv'):
                raise HTTPException(
                    status_code=400,
                    detail="Retraining file must be a CSV"
                )

            content = await file.read()
            tmp_file_path = save_temp_csv(content)

        job_id = f"retrain_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Add retraining task to background
        background_tasks.add_task(
            retrain_model_task,
            tmp_file_path,
            job_id,
            description
        )

        return {
            "job_id": job_id,
            "status": "started",
            "message": "Model retraining started in background",
            "filename": file.filename if file else None,
            "description": description,
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Retraining initiation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def retrain_model_task(new_data_path: Optional[str], job_id: str, description: Optional[str]):
    """Background task for model retraining"""
    try:
        logger.info(f"Starting retraining job: {job_id}")

        if description:
            logger.info(f"Job description: {description}")

        # Retrain model
        results = pipeline_manager.daily_retrain(new_data_path)

        if results:
            logger.info(f"✓ Retraining completed - Best model: {results.get('best_model', 'Unknown')}")
            logger.info(f"✓ New accuracy: {results.get('test_accuracy', 0):.2%}")
        else:
            logger.info("✓ Performance acceptable. No retraining needed.")

        # Clean up temporary file
        if new_data_path and os.path.exists(new_data_path):
            os.unlink(new_data_path)

        return results

    except Exception as e:
        logger.error(f"Retraining job {job_id} failed: {e}")
        logger.error(traceback.format_exc())

        # Clean up on error
        if new_data_path and os.path.exists(new_data_path):
            os.unlink(new_data_path)

        raise


@app.get("/api/v1/model/info", tags=["Model Management"])
async def get_model_info():
    """Get current model information"""
    try:
        check_model_loaded()

        model_info = {
            "model_loaded": True,
            "model_type": type(pipeline_manager.predictor.model).__name__,
            "model_version": getattr(pipeline_manager.predictor.model_trainer, 'model_version', 'unknown'),
            "feature_count": len(pipeline_manager.predictor.feature_columns) if pipeline_manager.predictor.feature_columns else 0,
            "last_training": pipeline_manager.predictor.health_status.get('last_training'),
            "training_score": pipeline_manager.predictor.model_trainer.last_training_score,
            "feature_importance": pipeline_manager.predictor.model_trainer.get_feature_importance(),
            "timestamp": datetime.now().isoformat()
        }

        return model_info

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get model info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ANALYTICS AND REPORTING ENDPOINTS
# ============================================================================

@app.get("/api/v1/analytics/courier-performance", tags=["Analytics"])
async def get_courier_performance():
    """Get comprehensive courier performance analysis"""
    try:
        check_model_loaded()

        report = pipeline_manager.predictor.get_courier_performance_report()

        return {
            "courier_performance": report,
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get courier performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/analytics/pincode/{pincode}", tags=["Analytics"])
@app.get("/api/v1/analytics/pincode", tags=["Analytics"])
async def get_pincode_analysis(pincode: Optional[str] = None):
    """
    Get pincode delivery analysis

    - If pincode provided: Get specific pincode statistics
    - If no pincode: Get top problematic pincodes
    """
    try:
        check_model_loaded()

        analysis = pipeline_manager.predictor.get_pincode_analysis(pincode)

        return {
            "pincode_analysis": analysis,
            "pincode": pincode,
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get pincode analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/reports/performance", tags=["Reports"])
async def generate_performance_report():
    """Generate comprehensive performance report"""
    try:
        if pipeline_manager is None:
            raise HTTPException(status_code=503, detail="Pipeline not initialized")

        logger.info("Generating performance report...")
        report = pipeline_manager.generate_performance_report()

        return {
            "report": report,
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/validate", tags=["Analytics"])
async def validate_predictions(
    predictions_file: UploadFile = File(...),
    actual_outcomes_file: UploadFile = File(...)
):
    """
    Validate predictions against actual outcomes

    Requires two CSV files:
    1. predictions_file: Previous predictions
    2. actual_outcomes_file: Actual delivery outcomes
    """
    try:
        if not predictions_file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Predictions file must be CSV")

        if not actual_outcomes_file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Actual outcomes file must be CSV")

        # Save files temporarily
        pred_content = await predictions_file.read()
        pred_path = save_temp_csv(pred_content)

        actual_content = await actual_outcomes_file.read()
        actual_path = save_temp_csv(actual_content)

        try:
            # Validate predictions
            validation_results = pipeline_manager.validate_recent_predictions(
                pred_path,
                actual_path
            )

            return {
                "validation_results": validation_results,
                "timestamp": datetime.now().isoformat()
            }

        finally:
            # Clean up
            if os.path.exists(pred_path):
                os.unlink(pred_path)
            if os.path.exists(actual_path):
                os.unlink(actual_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Validation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# BACKUP AND RECOVERY ENDPOINTS
# ============================================================================

@app.post("/api/v1/backup", tags=["Management"])
async def create_backup():
    """Create backup of current model"""
    try:
        if pipeline_manager is None:
            raise HTTPException(status_code=503, detail="Pipeline not initialized")

        logger.info("Creating model backup...")
        backup_path = pipeline_manager.create_backup()

        return {
            "success": True,
            "backup_path": backup_path,
            "message": "Backup created successfully",
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Backup creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/backups", tags=["Management"])
async def list_backups():
    """List all available backups"""
    try:
        if pipeline_manager is None:
            raise HTTPException(status_code=503, detail="Pipeline not initialized")

        backups = pipeline_manager.list_available_backups()

        return {
            "backups": backups,
            "count": len(backups),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to list backups: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/restore/{backup_name}", tags=["Management"])
async def restore_backup(backup_name: str = PathParam(..., description="Backup directory name")):
    """Restore model from backup"""
    try:
        if pipeline_manager is None:
            raise HTTPException(status_code=503, detail="Pipeline not initialized")

        backup_path = f"backups/{backup_name}"

        logger.info(f"Restoring from backup: {backup_name}")
        success = pipeline_manager.restore_backup(backup_path)

        if success:
            return {
                "success": True,
                "message": f"Model restored from backup: {backup_name}",
                "backup_name": backup_name,
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail="Backup restoration failed")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Restore failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/v1/backups/cleanup", tags=["Management"])
async def cleanup_old_backups(max_backups: int = Query(10, ge=1, le=100, description="Maximum backups to keep")):
    """Clean up old backups, keeping only the most recent N"""
    try:
        if pipeline_manager is None:
            raise HTTPException(status_code=503, detail="Pipeline not initialized")

        logger.info(f"Cleaning up backups, keeping {max_backups} most recent...")
        pipeline_manager.cleanup_old_backups(max_backups)

        remaining_backups = pipeline_manager.list_available_backups()

        return {
            "success": True,
            "message": f"Cleanup completed, kept {len(remaining_backups)} backups",
            "remaining_backups": remaining_backups,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    """
    Run the API server

    Usage:
        python src/apis/api_main.py

    Or with uvicorn directly:
        uvicorn src.apis.api_main:app --host 0.0.0.0 --port 8000 --reload
    """

    uvicorn.run(
        "src.apis.api_main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True
    )
