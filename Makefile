.PHONY: dev build preview test test-critical test-unit install clean

# ── PRIMARY COMMANDS ──────────────────────────────────────────────────────────

dev:
	@echo "Starting development server on http://localhost:5173 ..."
	cd frontend && npm run dev

install:
	@echo "Installing dependencies..."
	cd frontend && npm install

build:
	@echo "Building for production..."
	cd frontend && npm run build

preview:
	@echo "Previewing production build..."
	cd frontend && npm run preview

# ── TESTING ───────────────────────────────────────────────────────────────────

test:
	@echo "Running all E2E tests..."
	cd frontend && npm test

test-critical:
	@echo "Running critical-path E2E tests..."
	cd frontend && npm run test:critical

test-unit:
	@echo "Running unit tests..."
	cd frontend && npm run test:unit

test-ui:
	@echo "Opening Playwright UI mode..."
	cd frontend && npm run test:ui

# ── DEPLOYMENT ────────────────────────────────────────────────────────────────

deploy-vercel:
	@echo "Deploying to Vercel..."
	cd frontend && npm run build && npx vercel --prod

deploy-netlify:
	@echo "Deploying to Netlify..."
	cd frontend && npm run build && npx netlify deploy --prod --dir=dist

deploy-ghpages:
	@echo "Deploying to GitHub Pages..."
	cd frontend && npm run build && npx gh-pages -d dist

# ── CLEANUP ───────────────────────────────────────────────────────────────────

clean:
	@echo "Cleaning build artifacts..."
	rm -rf frontend/node_modules frontend/dist

# ── ARCHIVED BACKEND (not needed for gameplay) ────────────────────────────────

dev-backend:
	cd backend && uv run uvicorn datafusion.main:app --reload --host 0.0.0.0 --port 8000

test-backend:
	cd backend && uv run pytest

seed-db:
	cd backend && uv run python -m scripts.seed_database --reset --population 50 --seed 42
