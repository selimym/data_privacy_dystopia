.PHONY: dev dev-backend dev-frontend build preview deploy test test-backend seed-db install install-backend install-frontend clean kill-dev

# PRIMARY COMMANDS (Fat Client - Frontend Only)

dev: kill-dev
	@echo "Starting frontend development server..."
	cd frontend && pnpm dev

install:
	@echo "Installing frontend dependencies with pnpm..."
	cd frontend && pnpm install

build:
	@echo "Building frontend for production..."
	cd frontend && pnpm build

preview:
	@echo "Previewing production build..."
	cd frontend && pnpm preview

deploy:
	@echo "Deploying to static hosting..."
	@echo "Run one of the following:"
	@echo "  make deploy-vercel   # Deploy to Vercel"
	@echo "  make deploy-netlify  # Deploy to Netlify"
	@echo "  make deploy-ghpages  # Deploy to GitHub Pages"

deploy-vercel:
	@echo "Deploying to Vercel..."
	cd frontend && pnpm build && npx vercel --prod

deploy-netlify:
	@echo "Deploying to Netlify..."
	cd frontend && pnpm build && npx netlify deploy --prod --dir=dist

deploy-ghpages:
	@echo "Deploying to GitHub Pages..."
	cd frontend && pnpm build && npx gh-pages -d dist

clean:
	@echo "Cleaning up..."
	rm -rf frontend/node_modules
	rm -rf frontend/dist
	rm -rf backend/.venv
	rm -rf backend/__pycache__
	rm -rf backend/.pytest_cache
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

kill-dev:
	@echo "Stopping dev servers..."
	@-bash -c 'pgrep -f "vite.*bin/vite" | xargs -r kill -TERM 2>/dev/null' || true
	@sleep 1
	@echo "Dev servers stopped."

# ARCHIVED BACKEND COMMANDS (for reference only)

dev-backend:
	@echo "Starting backend server (archived - not required for gameplay)..."
	cd backend && uv run uvicorn datafusion.main:app --reload --host 0.0.0.0 --port 8000

install-backend:
	@echo "Installing backend dependencies with uv (archived)..."
	cd backend && uv sync

test-backend:
	@echo "Running backend tests (archived)..."
	cd backend && uv run pytest

seed-db:
	@echo "Seeding database (archived - game now generates data client-side)..."
	cd backend && uv run python -m scripts.seed_database --reset --population 50 --scenario rogue_employee --seed 42

# TESTING COMMANDS

test:
	@echo "Running all frontend tests..."
	cd frontend && pnpm test:e2e

test-critical:
	@echo "Running critical path E2E tests..."
	cd frontend && pnpm test:e2e:critical

test-features:
	@echo "Running feature E2E tests..."
	cd frontend && pnpm test:e2e:features

test-integration:
	@echo "Running integration tests..."
	cd frontend && pnpm test:e2e:integration

test-performance:
	@echo "Running performance tests..."
	cd frontend && pnpm test:e2e:performance

test-edge-cases:
	@echo "Running edge case tests..."
	cd frontend && pnpm test:e2e:edge-cases

test-ui:
	@echo "Opening Playwright UI mode..."
	cd frontend && pnpm test:e2e:ui

test-headed:
	@echo "Running tests in headed mode..."
	cd frontend && pnpm test:e2e:headed

test-report:
	@echo "Opening test report..."
	cd frontend && pnpm test:e2e:report

dev-frontend:
	@echo "Starting frontend development server..."
	cd frontend && pnpm dev

install-frontend:
	@echo "Installing frontend dependencies with pnpm..."
	cd frontend && pnpm install
