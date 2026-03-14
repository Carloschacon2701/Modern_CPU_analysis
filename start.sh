#!/bin/bash
# CPU Analyzer — start backend and frontend

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=== CPU Analyzer ==="
echo ""

# Start backend
echo "[1/2] Starting Python backend on http://localhost:8000 ..."
cd "$ROOT/backend"
if [ ! -d ".venv" ]; then
  echo "     Creating virtual environment..."
  python3 -m venv .venv
  .venv/bin/pip install -r requirements.txt -q
fi
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

sleep 2

# Start frontend
echo "[2/2] Starting Next.js frontend on http://localhost:3000 ..."
cd "$ROOT/frontend"
if [ ! -d "node_modules" ]; then
  echo "     Installing npm packages..."
  npm install -q
fi
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=== Running ==="
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
