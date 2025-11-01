#!/bin/bash
echo "=========================================="
echo "Docker Compose Verification"
echo "=========================================="

echo "✓ Checking Docker..."
docker --version || exit 1

echo "✓ Checking Docker Compose..."
docker compose version || exit 1

echo "✓ Validating base config..."
docker compose config --quiet && echo "  ✅ Base config valid" || exit 1

echo "✓ Validating dev config..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml config --quiet && echo "  ✅ Dev config valid" || exit 1

echo "✓ Listing services..."
docker compose config --services

echo ""
echo "=========================================="
echo "✅ Docker Compose setup is WORKING!"
echo "=========================================="
echo ""
echo "Ready to use:"
echo "  • docker compose up -d"
echo "  • make dev (if using Makefile)"
echo ""
