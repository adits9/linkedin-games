#!/bin/bash

# Daily LinkedIn Sudoku Scraper
# This script runs the scraper and can be scheduled with cron

cd "$(dirname "$0")"

echo "Running LinkedIn Sudoku Scraper..."
echo "Date: $(date)"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run the scraper
python3 scraper.py

echo "Scraper completed!"
