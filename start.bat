@echo off
REM Gantt Chart Application - Simple Startup Script
REM Windows Batch File

echo.
echo ========================================
echo  Gantt Chart Application Startup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if PostgreSQL is accessible
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] PostgreSQL (psql) not found in PATH
    echo Make sure PostgreSQL is installed and running
    echo.
)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [STEP 1/5] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed
    echo.
) else (
    echo [SKIP] Dependencies already installed
    echo.
)

REM Check if client/.env exists
if not exist "client\.env" (
    echo [STEP 2/5] Creating client environment file...
    copy "client\.env.example" "client\.env" >nul
    echo [SUCCESS] Created client/.env
    echo.
) else (
    echo [SKIP] Client environment file exists
    echo.
)

REM Check if server/.env exists
if not exist "server\.env" (
    echo [STEP 3/5] Creating server environment file...
    copy "server\.env.example" "server\.env" >nul
    echo [WARNING] Created server/.env - Please configure DATABASE_URL
    echo Edit server/.env and update your PostgreSQL credentials
    echo.
    echo Press any key to open the file in notepad...
    pause >nul
    notepad "server\.env"
    echo.
    echo Press any key after you've configured the database...
    pause >nul
) else (
    echo [SKIP] Server environment file exists
    echo.
)

REM Check if Prisma client is generated
if not exist "node_modules\.prisma\client\" (
    echo [STEP 4/5] Generating Prisma client...
    call npm run prisma:generate
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to generate Prisma client
        pause
        exit /b 1
    )
    echo [SUCCESS] Prisma client generated
    echo.
) else (
    echo [SKIP] Prisma client already generated
    echo.
)

REM Check database connection and run migrations
echo [STEP 5/5] Setting up database...
call npm run prisma:migrate deploy 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Database migration had issues
    echo This might be your first run. Trying to create database...
    echo.
    echo If you see errors, make sure:
    echo 1. PostgreSQL is running
    echo 2. Database 'gantt_chart_db' exists (or create it: createdb gantt_chart_db)
    echo 3. server/.env has correct DATABASE_URL
    echo.
    echo Press any key to try running migrations again...
    pause >nul
    call npm run prisma:migrate dev
)
echo.

echo ========================================
echo  Starting Application...
echo ========================================
echo.
echo Frontend will be available at: http://localhost:3000
echo Backend API will be available at: http://localhost:5000/api
echo.
echo Press Ctrl+C to stop the application
echo.

REM Start the application
call npm run dev
