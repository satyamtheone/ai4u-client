from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import pandas as pd
import json
import os
import tempfile
import uvicorn
from datetime import datetime
import logging
from pathlib import Path

# Import our RTO pipeline
from rto_predictor.bll.rto_pipeline import RTOPipelineManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="RTO Prediction API",
    description="Production-ready API for Return to Origin (RTO) prediction in shipments",
    version="1.0.0"
)

# Initialize pipeline manager
pipeline_manager = RTOPipelineManager("config.json")

# Pydantic models for API
class OrderData(BaseModel):
    CLIENT_NAME: str
    CUSTOMER_NAME: str
    CUSTOMER_PHONE: str
    CUSTOMER_ADDRESS: str
    CUSTOMER_CITY: str
    CUSTOMER_STATE: str
    PINCODE: str
    PAYMENT_MODE: str
    COURIER_NAME: str
    ITEM_DESCRIPTION: str
    WEIGHT: float = Field(gt=0)
    QTY: int = Field(gt=0)
    INVOICE_VALUE: float = Field(ge=0)
    ORDER_CREATION_DATE: Optional[str] = None

class BatchPredictionRequest(BaseModel):
    orders: List[OrderData]

class PredictionResponse(BaseModel):
    order_index: int
    rto_prediction: bool
    rto_probability: float
    risk_level: str
    explanation: str
    recommendations: List[str]
    similar_orders: List[Dict]

class BatchPredictionResponse(BaseModel):
    predictions: List[PredictionResponse]
    summary: Dict[str, Any]
    processing_time: float
    timestamp: str

@app.on_event("startup")
async def startup_event():
    """Initialize the API on startup"""
    logger.info("Starting RTO Prediction API...")
    
    # Try to load existing model
    try:
        pipeline_manager.predictor.load_model_snapshot()
        logger.info("Loaded existing model snapshot")
    except Exception as e:
        logger.warning(f"No existing model found: {e}")
        logger.info("API ready, but model needs to be trained first")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "RTO Prediction API",
        "version": "1.0.0",
        "status": "running",
        "model_loaded": pipeline_manager.predictor.model is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    model_status = "loaded" if pipeline_manager.predictor.model is not None else "not_loaded"
    
    return {
        "status": "healthy",
        "model_status": model_status,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_single_order(order: OrderData):
    """Predict RTO for a single order"""
    
    if pipeline_manager.predictor.model is None:
        raise HTTPException(
            status_code=503, 
            detail="Model not loaded. Please train the model first."
        )
    
    try:
        # Convert to dataframe
        df = pd.DataFrame([order.dict()])
        
        # Make prediction
        results = pipeline_manager.predictor.predict(df)
        
        if results['predictions']:
            prediction = results['predictions'][0]
            return PredictionResponse(**prediction)
        else:
            raise HTTPException(status_code=500, detail="Prediction failed")
            
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch_orders(request: BatchPredictionRequest):
    """Predict RTO for multiple orders"""
    
    if pipeline_manager.predictor.model is None:
        raise HTTPException(
            status_code=503, 
            detail="Model not loaded. Please train the model first."
        )
    
    if len(request.orders) > 1000:  # Limit batch size
        raise HTTPException(
            status_code=413, 
            detail="Batch size too large. Maximum 1000 orders per request."
        )
    
    try:
        start_time = datetime.now()
        
        # Convert to dataframe
        orders_data = [order.dict() for order in request.orders]
        df = pd.DataFrame(orders_data)
        
        # Make predictions
        results = pipeline_manager.predictor.predict(df)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return BatchPredictionResponse(
            predictions=[PredictionResponse(**pred) for pred in results['predictions']],
            summary=results['summary'],
            processing_time=processing_time,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/csv")
async def predict_from_csv(file: UploadFile = File(...)):
    """Predict RTO for orders from uploaded CSV file"""
    
    if pipeline_manager.predictor.model is None:
        raise HTTPException(
            status_code=503, 
            detail="Model not loaded. Please train the model first."
        )
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400, 
            detail="File must be a CSV"
        )
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        # Process the CSV
        results = pipeline_manager.process_new_orders(tmp_file_path)
        
        # Clean up temporary file
        os.unlink(tmp_file_path)
        
        return JSONResponse(content=results)
        
    except Exception as e:
        logger.error(f"CSV prediction error: {e}")
        if 'tmp_file_path' in locals():
            os.unlink(tmp_file_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train")
async def train_model(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Train the model with uploaded training data"""
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400, 
            detail="Training file must be a CSV"
        )
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        # Start training in background
        background_tasks.add_task(train_model_task, tmp_file_path)
        
        return {
            "message": "Model training started in background",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Training initiation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def train_model_task(training_file_path: str):
    """Background task for model training"""
    try:
        logger.info("Starting model training...")
        results = pipeline_manager.train_initial_model(training_file_path)
        logger.info(f"Model training completed: {results['best_model']}")
        
        # Clean up temporary file
        os.unlink(training_file_path)
        
    except Exception as e:
        logger.error(f"Model training error: {e}")
        if os.path.exists(training_file_path):
            os.unlink(training_file_path)

@app.post("/retrain")
async def retrain_model(background_tasks: BackgroundTasks, file: UploadFile = File(None)):
    """Retrain the model with new data"""
    
    if pipeline_manager.predictor.model is None:
        raise HTTPException(
            status_code=503, 
            detail="No existing model to retrain. Please train initial model first."
        )
    
    try:
        tmp_file_path = None
        
        if file:
            if not file.filename.endswith('.csv'):
                raise HTTPException(
                    status_code=400, 
                    detail="Retraining file must be a CSV"
                )
            
            # Save uploaded file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as tmp_file:
                content = await file.read()
                tmp_file.write(content)
                tmp_file_path = tmp_file.name
        
        # Start retraining in background
        background_tasks.add_task(retrain_model_task, tmp_file_path)
        
        return {
            "message": "Model retraining started in background",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Retraining initiation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def retrain_model_task(new_data_path: str = None):
    """Background task for model retraining"""
    try:
        logger.info("Starting model retraining...")
        results = pipeline_manager.daily_retrain(new_data_path)
        
        if results:
            logger.info(f"Model retrained: {results['best_model']}")
        else:
            logger.info("No retraining needed")
        
        # Clean up temporary file
        if new_data_path and os.path.exists(new_data_path):
            os.unlink(new_data_path)
            
    except Exception as e:
        logger.error(f"Model retraining error: {e}")
        if new_data_path and os.path.exists(new_data_path):
            os.unlink(new_data_path)

# @app.get("/performance/couriers")
# async def get_courier_performance():
#     """Get courier performance analysis"""
    
#     if pipeline_manager.predictor.model is None: