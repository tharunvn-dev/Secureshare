#!/bin/bash
# ==============================================================================
# SECURE STORAGE FRAMEWORK — SHUTDOWN SCRIPT (BASH)
# ==============================================================================

echo "Shutting down SecureShare Framework Services..."

# Kill port 8080
BACKEND_PID=$(lsof -ti:8080)
if [ -n "$BACKEND_PID" ]; then
    kill -9 $BACKEND_PID 2>/dev/null
    echo "Backend (PID $BACKEND_PID) stopped."
fi

# Kill port 5173
FRONTEND_PID=$(lsof -ti:5173)
if [ -n "$FRONTEND_PID" ]; then
    kill -9 $FRONTEND_PID 2>/dev/null
    echo "Frontend (PID $FRONTEND_PID) stopped."
fi

echo "All services shut down."
