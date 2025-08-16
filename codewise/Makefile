.PHONY: help build up down logs test lint format clean

# Default target
help:
	@echo "Available commands:"
	@echo "  build    - Build Docker images"
	@echo "  up       - Start all services"
	@echo "  down     - Stop all services"
	@echo "  logs     - Show logs"
	@echo "  test     - Run tests"
	@echo "  lint     - Run linting"
	@echo "  format   - Format code"
	@echo "  clean    - Clean up Docker resources"

# Build Docker images
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# Show logs
logs:
	docker-compose logs -f

# Run tests
test:
	docker-compose exec api python -m pytest tests/ -v

# Run linting
lint:
	docker-compose exec api python -m flake8 app/ --max-line-length=100
	docker-compose exec api python -m black app/ --check

# Format code
format:
	docker-compose exec api python -m black app/
	docker-compose exec api python -m isort app/

# Clean up Docker resources
clean:
	docker-compose down -v
	docker system prune -f

# Initialize database
init-db:
	docker-compose exec api python scripts/init_db.py

# Create new migration
migration:
	docker-compose exec api alembic revision --autogenerate -m "$(name)"

# Run migrations
migrate:
	docker-compose exec api alembic upgrade head
