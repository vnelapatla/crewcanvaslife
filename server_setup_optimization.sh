#!/bin/bash
# Server Optimization Script for CrewCanvas
# This script automates the memory and database optimizations.

echo "----------------------------------------"
echo "🚀 Starting Permanent Server Optimization..."
echo "----------------------------------------"

# 1. Automate Memory Cleanup (Cron Job)
echo "⏰ Setting up hourly memory cleanup..."
CRON_JOB="0 * * * * $(pwd)/free_memory.sh > /dev/null 2>&1"
(crontab -l 2>/dev/null | grep -v "free_memory.sh"; echo "$CRON_JOB") | crontab -
echo "✅ Hourly cron job established."

# 2. Optimize MySQL Configuration
echo "🗄️ Optimizing MySQL/MariaDB for low RAM..."
MYSQL_CONF="/etc/my.cnf"
if [ ! -f "$MYSQL_CONF" ]; then
    MYSQL_CONF="/etc/mysql/my.cnf"
fi

if [ -f "$MYSQL_CONF" ]; then
    # Backup
    sudo cp $MYSQL_CONF "${MYSQL_CONF}.bak"
    
    # Check if we already applied settings
    if ! grep -q "innodb_buffer_pool_size = 256M" "$MYSQL_CONF"; then
        sudo sed -i '/\[mysqld\]/a performance_schema = OFF\ninnodb_buffer_pool_size = 256M\ninnodb_log_buffer_size = 8M\nmax_connections = 50\nkey_buffer_size = 16M' $MYSQL_CONF
        echo "✅ MySQL configuration updated."
        echo "🔄 Restarting MySQL service..."
        sudo systemctl restart mariadb || sudo systemctl restart mysqld || sudo systemctl restart mysql
    else
        echo "ℹ️ MySQL already optimized."
    fi
else
    echo "⚠️ MySQL config not found. Please optimize /etc/my.cnf manually."
fi

# 3. Apply ZRAM (Optional but recommended)
if ! lsmod | grep -q zram; then
    echo "💡 Tip: For even better performance, consider enabling ZRAM on this instance."
fi

echo "----------------------------------------"
echo "✨ Permanent Optimization Complete!"
echo "----------------------------------------"
echo "Note: I have updated your 'deploy.sh' locally with leaner JVM flags."
echo "Please push the changes and run ./deploy.sh to apply the new Java settings."
