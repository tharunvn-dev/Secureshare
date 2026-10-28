#!/bin/bash
# ==============================================================================
# SECURE STORAGE FRAMEWORK — STARTUP SCRIPT (BASH)
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Starting SecureShare Framework..."

# 1. Start backend in background
cd "$ROOT_DIR/backend" || exit 1
mvn spring-boot:run > /dev/null 2>&1 &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID) on http://localhost:8080"

# 2. Start frontend in background
cd "$ROOT_DIR/web" || exit 1
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
echo "Frontend dev server started (PID: $FRONTEND_PID) on http://localhost:5173"

echo "Access the application at http://localhost:5173"
