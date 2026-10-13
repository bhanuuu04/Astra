#!/usr/bin/env bash
# ==============================================================================
# ASTRA DRP - Nimbus by ByteXL Auto-Deployment & Startup Script
# ==============================================================================
set -e

echo "🚀 Starting ASTRA Deployment on Nimbus by ByteXL..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Check Python & Node
command -v python3 >/dev/null 2>&1 || { echo "❌ Python3 is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm/Node.js is required but not installed."; exit 1; }

echo "📦 Python version: $(python3 --version)"
echo "📦 Node version:   $(node --version)"

# 2. Setup API Environment
echo "⚙️  Configuring API environment..."
if [ ! -f "apps/api/.env" ]; then
    cat <<EOF > apps/api/.env
APP_ENV=development
API_BASE_URL=http://0.0.0.0:8001
CORS_ORIGINS=*
DATABASE_URL=sqlite:///./astra_dev.db
ALLOW_ANONYMOUS_DEV=true
ALLOW_DEMO_RESET=true
ADMIN_API_KEY=astra_nimbus_admin_key
ASTRA_INTERNAL_API_KEY=astra_nimbus_internal_key
JWT_SECRET=astra_nimbus_jwt_secret_dev
EOF
    echo "✅ Created apps/api/.env with SQLite fallback"
fi

# 3. Setup Python Virtual Environment & Install Dependencies
echo "🐍 Setting up Python Virtual Environment..."
cd "$SCRIPT_DIR/apps/api"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip
pip install -e .

# Run database migrations or init SQLite tables
echo "🗄️ Initializing database..."
python3 -c "from app.db.models import Base; from app.db.session import engine; Base.metadata.create_all(bind=engine); print('Database schema initialized successfully!')"

# 4. Setup Web Environment
echo "🌐 Configuring Web environment..."
cd "$SCRIPT_DIR/apps/web"
if [ ! -f ".env.local" ]; then
    cat <<EOF > .env.local
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
ASTRA_INTERNAL_API_KEY=astra_nimbus_internal_key
EOF
    echo "✅ Created apps/web/.env.local"
fi

echo "📦 Installing Web dependencies (npm install)..."
npm install --no-audit --no-fund

# 5. Launch Backend & Frontend
echo "🚀 Launching ASTRA Backend on port 8001..."
cd "$SCRIPT_DIR/apps/api"
source .venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8001 > "$SCRIPT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started with PID $BACKEND_PID (logs: backend.log)"

echo "🚀 Launching ASTRA Frontend on port 3000..."
cd "$SCRIPT_DIR/apps/web"
echo ""
echo "=========================================================================="
echo "🎉 ASTRA is now running on Nimbus by ByteXL!"
echo "➡️  Frontend: http://0.0.0.0:3000 (Open port 3000 in Nimbus Ports / Preview)"
echo "➡️  Backend:  http://0.0.0.0:8001 (Swagger docs: http://0.0.0.0:8001/docs)"
echo "=========================================================================="
echo ""

# Run web app in foreground so container/terminal stays alive
npm run dev -- -H 0.0.0.0 -p 3000
