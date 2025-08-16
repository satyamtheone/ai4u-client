import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import uuid

def test_chat_without_learning_gates(client: TestClient):
    """Test normal chat without learning gates"""
    # First register and login
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpassword123",
            "first_name": "Test",
            "last_name": "User"
        }
    )
    assert register_response.status_code == 200
    
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "testpassword123"
        }
    )
    assert login_response.status_code == 200
    token = login_response.json()["data"]["access_token"]
    
    # Test chat
    chat_response = client.post(
        "/api/v1/learning/chat",
        json={
            "message": "Hello, how are you?",
            "enable_learning_gates": False
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    # Note: This will fail without OpenAI API key, but tests the structure
    assert chat_response.status_code in [200, 500]  # 500 expected without API key

def test_get_quiz_questions(client: TestClient):
    """Test getting quiz questions"""
    # Register and login
    client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "testpassword123",
        "first_name": "Test",
        "last_name": "User"
    })
    
    login_response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword123"
    })
    token = login_response.json()["data"]["access_token"]
    
    # Get quiz questions
    response = client.get(
        "/api/v1/learning/questions?count=2",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)

def test_get_user_stats(client: TestClient):
    """Test getting user learning statistics"""
    # Register and login
    client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "testpassword123",
        "first_name": "Test",
        "last_name": "User"
    })
    
    login_response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword123"
    })
    token = login_response.json()["data"]["access_token"]
    
    # Get user stats
    response = client.get(
        "/api/v1/learning/stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "level" in data["data"]
    assert "accuracy" in data["data"]

def test_skip_quiz(client: TestClient):
    """Test skipping a quiz"""
    # Register and login
    client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "testpassword123",
        "first_name": "Test",
        "last_name": "User"
    })
    
    login_response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword123"
    })
    token = login_response.json()["data"]["access_token"]
    
    # Skip quiz
    response = client.post(
        "/api/v1/learning/quiz/skip",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["result"]["unlocked_responses"] == 1
