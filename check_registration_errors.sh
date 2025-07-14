#!/bin/bash
# Script to check backend logs for registration errors

LOG_FILE="backend/logs/backend.log"  # Adjust path to your backend log file

if [ ! -f "$LOG_FILE" ]; then
  echo "Log file not found: $LOG_FILE"
  exit 1
fi

echo "Searching for registration errors in $LOG_FILE..."
grep -i "signup error" "$LOG_FILE" | tail -n 50

echo "Search complete. Displayed last 50 registration error log entries."
