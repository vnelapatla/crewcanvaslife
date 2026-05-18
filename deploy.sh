#!/bin/bash

# Standard Deployment Script for CrewCanvas (Optimized for 1GB RAM)
# This version stops the old instance before starting the new one to save memory.
# Note: There will be ~60 seconds of downtime during startup.

APP_PORT=8081
APP_DIR=""

# Improved Path Handling: Use current directory if $HOME/app is restricted
if [ -w "$HOME" ]; then
    APP_DIR="$HOME/app"
    mkdir -p "$APP_DIR"
else
    echo "Warning: $HOME is not writable. Using current directory for deployment."
    APP_DIR=$(pwd)
fi

cd "$APP_DIR"
JAR_NAME="crewcanvas.jar"

echo "----------------------------------------"
echo "Starting Standard Deployment on Port: $APP_PORT"
echo "----------------------------------------"

# 1. Ensure MySQL is running
echo "Checking database connectivity..."
if ! mysqladmin ping -h 127.0.0.1 -u root -proot --silent; then
    echo "MySQL seems to be down. Attempting to start service..."
    sudo systemctl start mariadb || sudo systemctl start mysqld || sudo systemctl start mysql || echo "Warning: Could not start MySQL."
    sleep 5
fi

# 2. Stop the current instance to free up memory
echo "Stopping current instance on port $APP_PORT to free up RAM..."
sudo fuser -k -9 $APP_PORT/tcp || true
sleep 5

# 3. Find and start the new version
LATEST_JAR=$(ls -t *.jar | head -1)
echo "Starting new instance: $LATEST_JAR"

# Using 512MB Heap - Optimized for 2GB RAM environment
nohup java \
  -Xms128m -Xmx512m \
  -XX:MaxMetaspaceSize=128m \
  -XX:+UseSerialGC \
  -XX:MinHeapFreeRatio=20 \
  -XX:MaxHeapFreeRatio=40 \
  -XX:+ExitOnOutOfMemoryError \
  -jar $LATEST_JAR \
  --server.port=$APP_PORT \
  > app.log 2>&1 &

# 4. Wait for application to start
echo "Waiting for application to start (this takes ~60-90 seconds)..."
MAX_RETRIES=40
RETRY_COUNT=0
HEALTH_CHECK_URL="http://127.0.0.1:$APP_PORT/api/health"

# Fallback health check if /api/health is not available
if ! curl -s "http://127.0.0.1:$APP_PORT/api/health" > /dev/null; then
    HEALTH_CHECK_URL="http://127.0.0.1:$APP_PORT"
fi

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s $HEALTH_CHECK_URL > /dev/null; then
        echo "Application started successfully on port $APP_PORT!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo "Warming up... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "ERROR: Application failed to start within timeout."
    echo "Check logs: tail -n 100 app.log"
    exit 1
fi

# 5. Ensure Nginx is pointing to the correct port
echo "Finalizing Nginx configuration..."
NGINX_CONF=""
if [ -f "/etc/nginx/sites-available/default" ]; then NGINX_CONF="/etc/nginx/sites-available/default"
elif [ -f "/etc/nginx/conf.d/default.conf" ]; then NGINX_CONF="/etc/nginx/conf.d/default.conf"
elif [ -f "/etc/nginx/nginx.conf" ]; then NGINX_CONF="/etc/nginx/nginx.conf"
fi

if [ -n "$NGINX_CONF" ]; then
    echo "Updating Nginx at $NGINX_CONF"
    sudo sed -i "s/proxy_pass http:\/\/\(localhost\|127\.0\.0\.1\):[0-9]*/proxy_pass http:\/\/127.0.0.1:$APP_PORT/g" $NGINX_CONF
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "Nginx reloaded."
    fi
fi

echo "Deployment Complete! Port $APP_PORT is now live."
