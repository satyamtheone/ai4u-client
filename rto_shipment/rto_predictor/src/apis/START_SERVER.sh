#!/bin/bash

# RTO Predictor API Startup Script

echo "========================================"
echo "  RTO Predictor API Server"
echo "========================================"
echo ""

# Check if we're in the correct directory
if [ ! -f "src/apis.py" ]; then
    echo "Error: Please run this script from the rto_predictor directory"
    exit 1
fi

# Create necessary directories
echo "Setting up directories..."
mkdir -p logs models output backups data/to_train data/to_predict

# Check Python installation
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

echo "Python version:"
python3 --version
echo ""

# Check if uvicorn is installed
if ! python3 -c "import uvicorn" 2>/dev/null; then
    echo "Installing uvicorn..."
    pip3 install uvicorn
fi

# Start the server
echo "Starting API server..."
echo "Server will be available at: http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start with auto-reload for development
uvicorn src.apis:app --reload --host 0.0.0.0 --port 8000

