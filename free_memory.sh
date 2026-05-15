#!/bin/bash
# Memory Cleanup Utility for CrewCanvas EC2
# This script safely clears system caches and ensures no orphan processes are consuming RAM.

echo "----------------------------------------"
echo "🚀 Starting System Memory Cleanup..."
echo "----------------------------------------"

# 1. Sync files to disk first (Important before dropping caches)
echo "💾 Syncing file system..."
sync

# 2. Clear PageCache, dentries, and inodes
# 1 = PageCache
# 2 = Dentries and Inodes
# 3 = All
echo "🧹 Clearing System Caches..."
sudo sh -c "echo 3 > /proc/sys/vm/drop_caches"

# 3. Ensure no orphan Java processes are running
# Sometimes 'nohup' processes don't die properly during redeployment
echo "🔍 Checking for orphan Java processes..."
APP_PORT=8081
# This kills anything on the app port, which is already in deploy.sh but good for a standalone cleanup
sudo fuser -k $APP_PORT/tcp 2>/dev/null || echo "No active process on port $APP_PORT"

# 4. Flush MySQL to release internal buffers
echo "🗄️ Flushing MySQL buffers..."
# This doesn't delete data, just releases some overhead
mysqladmin -u root -proot flush-tables 2>/dev/null || echo "MySQL flush skipped (check credentials if needed)"

# 5. Clean up temporary files
echo "🗑️ Cleaning /tmp directory..."
sudo find /tmp -type f -atime +1 -delete

echo "----------------------------------------"
echo "✅ Memory Cleanup Completed!"
echo "----------------------------------------"

# Show new memory status
free -m
echo "----------------------------------------"
echo "Tip: If memory usage is still high, consider restarting the 'mariadb' or 'nginx' services."
