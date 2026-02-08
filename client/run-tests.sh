#!/bin/bash

# Test Runner Script
# Provides easy access to different test suites

set -e

COLOR_RESET="\033[0m"
COLOR_GREEN="\033[32m"
COLOR_BLUE="\033[34m"
COLOR_YELLOW="\033[33m"
COLOR_RED="\033[31m"

echo -e "${COLOR_BLUE}╔════════════════════════════════════════╗${COLOR_RESET}"
echo -e "${COLOR_BLUE}║   Gantt Chart Test Runner             ║${COLOR_RESET}"
echo -e "${COLOR_BLUE}╚════════════════════════════════════════╝${COLOR_RESET}"
echo ""

show_menu() {
    echo -e "${COLOR_GREEN}Select test suite to run:${COLOR_RESET}"
    echo ""
    echo "  1) All tests"
    echo "  2) Unit tests only"
    echo "  3) Integration tests only"
    echo "  4) Watch mode (all tests)"
    echo "  5) Coverage report"
    echo "  6) CI mode (with coverage)"
    echo "  7) Debug mode"
    echo "  8) Specific file..."
    echo "  9) Quick test (changed files only)"
    echo "  0) Exit"
    echo ""
}

run_all_tests() {
    echo -e "${COLOR_YELLOW}Running all tests...${COLOR_RESET}"
    npm test
}

run_unit_tests() {
    echo -e "${COLOR_YELLOW}Running unit tests only...${COLOR_RESET}"
    npm run test:unit
}

run_integration_tests() {
    echo -e "${COLOR_YELLOW}Running integration tests only...${COLOR_RESET}"
    npm run test:integration
}

run_watch_mode() {
    echo -e "${COLOR_YELLOW}Starting watch mode...${COLOR_RESET}"
    npm run test:watch
}

run_coverage() {
    echo -e "${COLOR_YELLOW}Generating coverage report...${COLOR_RESET}"
    npm run test:coverage
    echo ""
    echo -e "${COLOR_GREEN}Opening coverage report...${COLOR_RESET}"

    # Open coverage report based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open coverage/lcov-report/index.html
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows
        start coverage/lcov-report/index.html
    else
        # Linux
        xdg-open coverage/lcov-report/index.html
    fi
}

run_ci_mode() {
    echo -e "${COLOR_YELLOW}Running tests in CI mode...${COLOR_RESET}"
    npm run test:ci
}

run_debug_mode() {
    echo -e "${COLOR_YELLOW}Starting debug mode...${COLOR_RESET}"
    echo -e "${COLOR_BLUE}Open chrome://inspect in Chrome to debug${COLOR_RESET}"
    npm run test:debug
}

run_specific_file() {
    echo ""
    echo -e "${COLOR_GREEN}Enter test file name (or pattern):${COLOR_RESET}"
    read -r filename

    if [ -n "$filename" ]; then
        echo -e "${COLOR_YELLOW}Running tests for: $filename${COLOR_RESET}"
        npm test -- "$filename"
    else
        echo -e "${COLOR_RED}No filename provided${COLOR_RESET}"
    fi
}

run_quick_test() {
    echo -e "${COLOR_YELLOW}Running tests for changed files only...${COLOR_RESET}"
    npm test -- --onlyChanged
}

# Main loop
while true; do
    show_menu
    read -r -p "Enter choice [0-9]: " choice
    echo ""

    case $choice in
        1) run_all_tests ;;
        2) run_unit_tests ;;
        3) run_integration_tests ;;
        4) run_watch_mode ;;
        5) run_coverage ;;
        6) run_ci_mode ;;
        7) run_debug_mode ;;
        8) run_specific_file ;;
        9) run_quick_test ;;
        0)
            echo -e "${COLOR_BLUE}Exiting...${COLOR_RESET}"
            exit 0
            ;;
        *)
            echo -e "${COLOR_RED}Invalid option. Please try again.${COLOR_RESET}"
            ;;
    esac

    echo ""
    echo -e "${COLOR_GREEN}Test run completed!${COLOR_RESET}"
    echo ""
    read -r -p "Press Enter to continue..."
    echo ""
done
