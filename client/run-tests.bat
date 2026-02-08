@echo off
REM Test Runner Script for Windows
REM Provides easy access to different test suites

setlocal enabledelayedexpansion

:MAIN_MENU
cls
echo ========================================
echo    Gantt Chart Test Runner
echo ========================================
echo.
echo Select test suite to run:
echo.
echo   1) All tests
echo   2) Unit tests only
echo   3) Integration tests only
echo   4) Watch mode (all tests)
echo   5) Coverage report
echo   6) CI mode (with coverage)
echo   7) Debug mode
echo   8) Specific file...
echo   9) Quick test (changed files only)
echo   0) Exit
echo.
set /p choice="Enter choice [0-9]: "

if "%choice%"=="1" goto RUN_ALL
if "%choice%"=="2" goto RUN_UNIT
if "%choice%"=="3" goto RUN_INTEGRATION
if "%choice%"=="4" goto RUN_WATCH
if "%choice%"=="5" goto RUN_COVERAGE
if "%choice%"=="6" goto RUN_CI
if "%choice%"=="7" goto RUN_DEBUG
if "%choice%"=="8" goto RUN_SPECIFIC
if "%choice%"=="9" goto RUN_QUICK
if "%choice%"=="0" goto EXIT
goto INVALID

:RUN_ALL
echo.
echo Running all tests...
echo.
call npm test
goto COMPLETE

:RUN_UNIT
echo.
echo Running unit tests only...
echo.
call npm run test:unit
goto COMPLETE

:RUN_INTEGRATION
echo.
echo Running integration tests only...
echo.
call npm run test:integration
goto COMPLETE

:RUN_WATCH
echo.
echo Starting watch mode...
echo.
call npm run test:watch
goto COMPLETE

:RUN_COVERAGE
echo.
echo Generating coverage report...
echo.
call npm run test:coverage
echo.
echo Opening coverage report...
start coverage\lcov-report\index.html
goto COMPLETE

:RUN_CI
echo.
echo Running tests in CI mode...
echo.
call npm run test:ci
goto COMPLETE

:RUN_DEBUG
echo.
echo Starting debug mode...
echo Open chrome://inspect in Chrome to debug
echo.
call npm run test:debug
goto COMPLETE

:RUN_SPECIFIC
echo.
set /p filename="Enter test file name (or pattern): "
if "%filename%"=="" (
    echo No filename provided
    goto COMPLETE
)
echo.
echo Running tests for: %filename%
echo.
call npm test -- %filename%
goto COMPLETE

:RUN_QUICK
echo.
echo Running tests for changed files only...
echo.
call npm test -- --onlyChanged
goto COMPLETE

:COMPLETE
echo.
echo Test run completed!
echo.
pause
goto MAIN_MENU

:INVALID
echo.
echo Invalid option. Please try again.
echo.
pause
goto MAIN_MENU

:EXIT
echo.
echo Exiting...
exit /b 0
