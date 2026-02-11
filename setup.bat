@echo off
REM Gantt Chart Application - One-Time Setup Script
REM Windows Batch File

echo.
echo ========================================
echo  Gantt Chart Application Setup
echo  One-Time Configuration
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install from: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js is installed

REM Check PostgreSQL
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] PostgreSQL not found in PATH
    echo Please make sure PostgreSQL is installed
    echo.
) else (
    echo [OK] PostgreSQL is installed
)

echo.
echo ========================================
echo  Step 1: Install Dependencies
echo ========================================
echo.
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Dependencies installed

echo.
echo ========================================
echo  Step 2: Configure Environment
echo ========================================
echo.

REM Client environment
if not exist "client\.env" (
    copy "client\.env.example" "client\.env" >nul
    echo [SUCCESS] Created client/.env
) else (
    echo [SKIP] client/.env already exists
)

REM Server environment
if not exist "server\.env" (
    copy "server\.env.example" "server\.env" >nul
    echo [SUCCESS] Created server/.env
    echo.
    echo IMPORTANT: Configure your database connection!
    echo.
    echo Opening server/.env in notepad...
    echo Please update the DATABASE_URL with your PostgreSQL credentials:
    echo   Format: postgresql://username:password@localhost:5432/gantt_chart_db
    echo.
    pause
    notepad "server\.env"
    echo.
    echo Press any key after saving the file...
    pause >nul
) else (
    echo [SKIP] server/.env already exists
    echo.
    echo Current DATABASE_URL:
    findstr "DATABASE_URL" server\.env
    echo.
    set /p update="Update database configuration? (y/n): "
    if /i "%update%"=="y" notepad "server\.env"
)

echo.
echo ========================================
echo  Step 3: Database Setup
echo ========================================
echo.
echo Creating PostgreSQL database...
echo.
echo Enter your PostgreSQL username (default: postgres):
set /p PG_USER=
if "%PG_USER%"=="" set PG_USER=postgres

echo.
echo Running: psql -U %PG_USER% -c "CREATE DATABASE gantt_chart_db;"
psql -U %PG_USER% -c "CREATE DATABASE gantt_chart_db;"
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Database created
) else (
    echo [INFO] Database might already exist (this is OK)
)

echo.
echo ========================================
echo  Step 4: Generate Prisma Client
echo ========================================
echo.
call npm run prisma:generate
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to generate Prisma client
    pause
    exit /b 1
)
echo [SUCCESS] Prisma client generated

echo.
echo ========================================
echo  Step 5: Run Database Migrations
echo ========================================
echo.
call npm run prisma:migrate dev
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to run migrations
    echo.
    echo Please check:
    echo 1. PostgreSQL is running
    echo 2. DATABASE_URL in server/.env is correct
    echo 3. Database 'gantt_chart_db' exists
    pause
    exit /b 1
)
echo [SUCCESS] Database migrations completed

echo.
echo ========================================
echo  Step 6: Seed Database (Optional)
echo ========================================
echo.
set /p seed="Add sample data to database? (y/n): "
if /i "%seed%"=="y" (
    call npm run prisma:seed
    echo [SUCCESS] Database seeded
)

echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo You can now start the application with:
echo   Windows: start.bat
echo   Or: npm run dev
echo.
echo The application will be available at:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000/api
echo.
pause
