# api/ide_bridge.py
from fastapi import APIRouter, WebSocket
from typing import Dict, Any
import json

router = APIRouter(prefix="/ide", tags=["IDE Integration"])

class IDEBridge:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, ide_type: str, user_id: str):
        await websocket.accept()
        connection_id = f"{ide_type}:{user_id}"
        self.active_connections[connection_id] = websocket
    
    async def notify_code_ready(self, user_id: str, code_data: Dict[str, Any]):
        """Notify all connected IDEs when code is ready"""
        for connection_id, websocket in self.active_connections.items():
            if user_id in connection_id:
                await websocket.send_json({
                    "type": "code_ready",
                    "data": code_data
                })

ide_bridge = IDEBridge()

@router.websocket("/connect/{ide_type}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, ide_type: str, user_id: str):
    await ide_bridge.connect(websocket, ide_type, user_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "ping":
                await websocket.send_json({"type": "pong"})
            elif data["type"] == "context_update":
                # Handle IDE context updates
                await handle_context_update(user_id, data["context"])
                
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        # Remove connection
        connection_id = f"{ide_type}:{user_id}"
        if connection_id in ide_bridge.active_connections:
            del ide_bridge.active_connections[connection_id]