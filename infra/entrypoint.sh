#!/bin/bash
set -e

PORT="${PORT:-8080}"

echo "=================================================="
echo "   NEURO-CUT // GOOGLE CLOUD RUN DUAL RUNTIME"
echo "=================================================="
echo "Entry port: ${PORT}"

# 1. Start Python FastAPI backend on internal loopback 127.0.0.1:8000
echo ">>> Launching FastAPI Backend on 127.0.0.1:8000..."
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Wait for FastAPI to be responsive (up to 60s)
echo ">>> Awaiting FastAPI startup..."
FASTAPI_READY=0
for i in {1..120}; do
    if curl -s http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
        echo ">>> FastAPI Backend is ONLINE and HEALTHY!"
        FASTAPI_READY=1
        break
    fi
    sleep 0.5
done

if [ $FASTAPI_READY -ne 1 ]; then
    echo "ERROR: FastAPI failed to start within 60 seconds!"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# 2. Start Next.js Frontend on 0.0.0.0:$PORT
echo ">>> Launching Next.js Directorial Studio on 0.0.0.0:${PORT}..."
cd /app/frontend
npx next start -p "${PORT}" -H 0.0.0.0 &
FRONTEND_PID=$!

# Wait for either process to terminate
wait -n $BACKEND_PID $FRONTEND_PID
EXIT_CODE=$?
echo "A service exited with code ${EXIT_CODE}. Shutting down container..."
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
exit $EXIT_CODE
