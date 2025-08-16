.PHONY: help build up down logs test lint format clean seed-questions

# Default target
help:
	@echo "Available commands:"
	@echo "  build           - Build Docker images"
	@echo "  up              - Start all services"
	@echo "  down            - Stop all services"
	@echo "  logs            - Show logs"
	@echo "  test            - Run tests"
	@echo "  lint            - Run linting"
	@echo "  format          - Format code"
	@echo "  clean           - Clean up Docker resources"
	@echo "  init-db         - Initialize database"
	@echo "  seed-questions  - Seed quiz questions"
	@echo "  migration       - Create new migration"
	@echo "  migrate         - Run migrations"

# Build Docker images
build:
	docker compose build

# Start all services
up:
	docker compose up -d

# Stop all services
down:
	docker compose down

# Show logs
logs:
	docker compose logs -f

# Run tests
test:
	docker compose exec api python -m pytest tests/ -v

# Run linting
lint:
	docker compose exec api python -m flake8 backend/ --max-line-length=100
	docker compose exec api python -m black backend/ --check

# Format code
format:
	docker compose exec api python -m black backend/
	docker compose exec api python -m isort backend/

# Clean up Docker resources
clean:
	docker compose down -v
	docker system prune -f

# Initialize database
init-db:
	docker compose exec api python backend/scripts/init_db.py

# Seed quiz questions
seed-questions:
	docker compose exec api python scripts/seed_questions.py

# Create new migration
migration:
	docker compose exec api alembic revision --autogenerate -m "$(name)"

# Run migrations
migrate:
	docker compose exec api alembic upgrade head

alembic-init:
	docker compose exec api alembic init alembic

clean-containers:
	docker rm -f multitenancy_db multitenancy_redis multitenancy_api || true

ls-api-container:
	docker compose exec api ls -la 

wait-for-db:
	@echo "Waiting for database to be ready..."
	@sleep 10

create-initial-migration:
	docker compose exec api alembic revision --autogenerate -m "Initial migration"

# Quick setup for development
dev-setup: clean-containers build up wait-for-db ls-api-container migrate seed-questions
	@echo "Development environment ready!"
	@echo "API: http://localhost:8000"
	@echo "Docs: http://localhost:8000/docs"
