# Makefile for RTO Prediction System
# Simplifies common Docker and development operations

.PHONY: help build up down logs clean dev prod test migrate db-shell db-backup

# Default target
help:
	@echo "RTO Prediction System - Available Commands"
	@echo "==========================================="
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment (hot-reload)"
	@echo "  make dev-build    - Build and start dev environment"
	@echo "  make dev-logs     - Show development logs"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-build   - Build and start prod environment"
	@echo "  make prod-logs    - Show production logs"
	@echo ""
	@echo "Basic Operations:"
	@echo "  make build        - Build Docker images"
	@echo "  make up           - Start services"
	@echo "  make down         - Stop services"
	@echo "  make restart      - Restart services"
	@echo "  make logs         - Show logs"
	@echo "  make ps           - Show running containers"
	@echo ""
	@echo "Database:"
	@echo "  make migrate      - Run database migrations"
	@echo "  make db-shell     - Open PostgreSQL shell"
	@echo "  make db-backup    - Backup database"
	@echo "  make db-restore   - Restore database from backup"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean        - Stop and remove containers, networks"
	@echo "  make clean-all    - Clean everything including volumes"
	@echo "  make test         - Run tests"
	@echo "  make lint         - Run linters"
	@echo ""
	@echo "Utilities:"
	@echo "  make shell        - Open backend shell"
	@echo "  make health       - Check service health"
	@echo "  make stats        - Show container stats"

# Development environment
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

dev-build:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

dev-logs:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

dev-down:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Production environment
prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-build:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

prod-logs:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

prod-down:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Basic operations
build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

ps:
	docker-compose ps

stats:
	docker stats

# Database operations
migrate:
	docker-compose exec backend python scripts/run_migrations.py upgrade

migrate-create:
	@read -p "Enter migration message: " msg; \
	docker-compose exec backend python scripts/run_migrations.py autogen "$$msg"

migrate-rollback:
	docker-compose exec backend python scripts/run_migrations.py downgrade

db-shell:
	docker-compose exec postgres psql -U postgres -d rto_predictions

db-backup:
	@mkdir -p backups
	docker-compose exec postgres pg_dump -U postgres rto_predictions > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup created in backups/"

db-restore:
	@read -p "Enter backup file name: " file; \
	docker-compose exec -T postgres psql -U postgres rto_predictions < $$file

# Testing
test:
	docker-compose exec backend pytest tests/ -v

test-coverage:
	docker-compose exec backend pytest tests/ --cov=src --cov-report=html

# Code quality
lint:
	docker-compose exec backend flake8 src/
	docker-compose exec backend black --check src/
	docker-compose exec backend mypy src/

format:
	docker-compose exec backend black src/

# Utilities
shell:
	docker-compose exec backend /bin/bash

python-shell:
	docker-compose exec backend python

health:
	@echo "Checking service health..."
	@curl -s http://localhost:8002/health | python -m json.tool || echo "Backend not responding"

api-docs:
	@echo "API Documentation: http://localhost:8002/docs"
	@open http://localhost:8002/docs || xdg-open http://localhost:8002/docs || echo "Open http://localhost:8002/docs in your browser"

# Maintenance
clean:
	docker-compose down
	docker-compose rm -f

clean-all:
	docker-compose down -v
	docker system prune -f

clean-images:
	docker rmi rto_predictor_backend || true

# Setup
setup-env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env file created. Please update with your settings."; \
	else \
		echo ".env file already exists."; \
	fi

init: setup-env build migrate
	@echo "System initialized successfully!"
	@echo "Run 'make up' to start services"

# Production shortcuts
prod-deploy: prod-build migrate
	@echo "Production deployment complete!"

prod-update:
	git pull
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	$(MAKE) migrate
	@echo "Production update complete!"

# Monitoring
watch-logs:
	watch -n 2 'docker-compose logs --tail=50'

show-stats:
	docker stats --no-stream

# Backup
backup-all: db-backup
	@echo "Creating full backup..."
	@tar -czf backups/full_backup_$$(date +%Y%m%d_%H%M%S).tar.gz models/ logs/
	@echo "Full backup created in backups/"
