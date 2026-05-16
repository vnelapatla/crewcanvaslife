#!/bin/bash
# Stop Automated Maintenance
# This script removes the hourly cleanup cron job.

echo "----------------------------------------"
echo "🛑 Disabling Automated Memory Cleanup..."
echo "----------------------------------------"

# Remove the line from crontab
crontab -l 2>/dev/null | grep -v "free_memory.sh" | crontab -

echo "✅ Automated cleanup has been disabled."
echo "Note: The 'free_memory.sh' script will no longer run every hour."
echo "----------------------------------------"
