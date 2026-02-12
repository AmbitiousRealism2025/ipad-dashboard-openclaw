.PHONY: dev build clean install test docker-up docker-down docker-logs help

# Default target
help:
	@echo "iPad Dashboard - Available Commands"
	@echo "=================================="
	@echo "make dev         - Start development servers (backend + frontend)"
	@echo "make build       - Build for production"
	@echo "make clean       - Remove build artifacts and node_modules"
	@echo "make install     - Install all dependencies"
	@echo "make test        - Run tests"
	@echo "make docker-up   - Start services with Docker Compose"
	@echo "make docker-down - Stop Docker services"
	@echo "make docker-logs - View Docker logs"
	@echo "make setup       - Initial project setup"
	@echo ""

# Development
dev:
	@echo "Starting development servers..."
	@trap 'kill 0' INT; \
	(cd backend && npm run dev) & \
	(cd frontend && npm run dev) & \
	wait

# Build
build:
	@echo "Building backend..."
	cd backend && npm run build
	@echo "Building frontend..."
	cd frontend && npm run build

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Clean
clean:
	@echo "Cleaning build artifacts..."
	rm -rf backend/dist
	rm -rf frontend/dist
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	rm -rf node_modules

# Test
test:
	@echo "Running tests..."
	cd backend && npm test
	cd frontend && npm test

# Docker
docker-up:
	@echo "Starting Docker services..."
	docker-compose up -d
	@echo "Services started. View logs with: make docker-logs"

docker-down:
	@echo "Stopping Docker services..."
	docker-compose down

docker-logs:
	docker-compose logs -f

# Initial setup
setup:
	@echo "Setting up iPad Dashboard..."
	cp .env.example .env 2>/dev/null || true
	$(MAKE) install
	@echo ""
	@echo "Setup complete!"
	@echo "1. Edit .env with your configuration"
	@echo "2. Run 'make dev' to start development servers"
	@echo "3. Open http://localhost:5173 in your browser"

# Production deployment (Tailscale)
deploy-prod:
	@echo "Deploying to production..."
	@echo "Ensure Tailscale is configured and running"
	docker-compose -f docker-compose.prod.yml up -d --build
