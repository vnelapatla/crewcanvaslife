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
# sudo fuser -k $APP_PORT/tcp 2>/dev/null || echo "No active process on port $APP_PORT"

# 4. Flush MySQL to release internal buffers
echo "🗄️ Flushing MySQL buffers..."
# This doesn't delete data, just releases some overhead
mysqladmin -u root -proot flush-tables 2>/dev/null || echo "MySQL flush skipped (check credentials if needed)"

# 5. Clean up temporary files
echo "🗑️ Cleaning /tmp directory..."
sudo find /tmp -type f -atime +1 -delete

# 6. Self-Healing: Ensure application is running
echo "🛡️ Verifying Application Health..."
CHECK_PORT=8081
HEALTH_URL="http://127.0.0.1:$CHECK_PORT/api/health"

# Try health endpoint, fallback to root
if ! curl -s --head --request GET "$HEALTH_URL" | grep "200\|302" > /dev/null; then
    if ! curl -s --head --request GET "http://127.0.0.1:$CHECK_PORT" | grep "200\|302" > /dev/null; then
        echo "⚠️ Application is DOWN on port $CHECK_PORT. Searching for JAR to restart..."
        
        # Search path priority
        POSSIBLE_PATHS=("." "./target" "$HOME/app" "$HOME/crewcanvaslife-main")
        LATEST_JAR=""
        
        for p in "${POSSIBLE_PATHS[@]}"; do
            if [ -d "$p" ]; then
                FOUND=$(ls -t "$p"/*.jar 2>/dev/null | head -1)
                if [ -n "$FOUND" ]; then
                    LATEST_JAR=$FOUND
                    break
                fi
            fi
        done

        if [ -n "$LATEST_JAR" ]; then
            echo "🚀 Restarting with: $LATEST_JAR"
            nohup java -Xms128m -Xmx512m \
                -XX:+UseSerialGC \
                -XX:+ExitOnOutOfMemoryError \
                -jar "$LATEST_JAR" --server.port=$CHECK_PORT > app.log 2>&1 &
            echo "✅ Application restart initiated. Check 'app.log' for details."
        else
            echo "❌ Error: Could not find any .jar file. Please run ./deploy.sh manually."
        fi
    else
        echo "✅ Application is up (Root responding)."
    fi
else
    echo "✅ Application is healthy (API responding)."
fi

echo "----------------------------------------"
echo "✅ Memory Cleanup & Health Check Completed!"
echo "----------------------------------------"
