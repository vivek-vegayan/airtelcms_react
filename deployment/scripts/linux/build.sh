#!/usr/bin/env bash
# ============================================================================
# CHM - Build frontend (Vite) and backend (Maven WAR) on the build machine.
# Usage: ./build.sh [frontend|backend|all]   (default: all)
# ============================================================================
set -euo pipefail

FRONTEND_DIR="${FRONTEND_DIR:-$HOME/CHM_airtel_beta}"
BACKEND_DIR="${BACKEND_DIR:-$HOME/airtelmanagement}"
TARGET="${1:-all}"

build_frontend() {
    echo "=== Building frontend (vite build via 'ready-hoja') ==="
    cd "$FRONTEND_DIR"
    npm ci || npm install
    npm run ready-hoja
    echo "Frontend build output: $FRONTEND_DIR/dist"
}

build_backend() {
    echo "=== Building backend (Maven package, tests skipped) ==="
    cd "$BACKEND_DIR"
    ./mvnw clean package -DskipTests
    echo "Backend artifact: $BACKEND_DIR/target/airtelmanagement-0.0.1-SNAPSHOT.war"
}

case "$TARGET" in
    frontend) build_frontend ;;
    backend)  build_backend ;;
    all)      build_frontend; build_backend ;;
    *) echo "Usage: $0 [frontend|backend|all]"; exit 1 ;;
esac

echo "BUILD OK"
