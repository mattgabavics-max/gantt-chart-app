#!/bin/bash
# Gantt Chart Application - Simple Startup Script
# Unix/Linux/macOS Shell Script

set -e

echo ""
echo "========================================"
echo " Gantt Chart Application Startup"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if PostgreSQL is accessible
if ! command -v psql &> /dev/null; then
    echo "[WARNING] PostgreSQL (psql) not found in PATH"
    echo "Make sure PostgreSQL is installed and running"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[STEP 1/5] Installing dependencies..."
    npm install
    echo "[SUCCESS] Dependencies installed"
    echo ""
else
    echo "[SKIP] Dependencies already installed"
    echo ""
fi

# Check if client/.env exists
if [ ! -f "client/.env" ]; then
    echo "[STEP 2/5] Creating client environment file..."
    cp "client/.env.example" "client/.env"
    echo "[SUCCESS] Created client/.env"
    echo ""
else
    echo "[SKIP] Client environment file exists"
    echo ""
fi

# Check if server/.env exists
if [ ! -f "server/.env" ]; then
    echo "[STEP 3/5] Creating server environment file..."
    cp "server/.env.example" "server/.env"
    echo "[WARNING] Created server/.env"
    echo "Please edit server/.env and configure your DATABASE_URL"
    echo ""
    echo "Press Enter after you've configured the database..."
    read
else
    echo "[SKIP] Server environment file exists"
    echo ""
fi

# Check if Prisma client is generated
if [ ! -d "node_modules/.prisma/client" ]; then
    echo "[STEP 4/5] Generating Prisma client..."
    npm run prisma:generate
    echo "[SUCCESS] Prisma client generated"
    echo ""
else
    echo "[SKIP] Prisma client already generated"
    echo ""
fi

# Check database connection and run migrations
echo "[STEP 5/5] Setting up database..."
if ! npm run prisma:migrate deploy 2>/dev/null; then
    echo "[WARNING] Database migration had issues"
    echo "This might be your first run."
    echo ""
    echo "If you see errors, make sure:"
    echo "1. PostgreSQL is running"
    echo "2. Database 'gantt_chart_db' exists (or create it: createdb gantt_chart_db)"
    echo "3. server/.env has correct DATABASE_URL"
    echo ""
    echo "Press Enter to try running migrations..."
    read
    npm run prisma:migrate dev
fi
echo ""

echo "========================================"
echo " Starting Application..."
echo "========================================"
echo ""
echo "Frontend will be available at: http://localhost:3000"
echo "Backend API will be available at: http://localhost:5000/api"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

# Start the application
npm run dev
