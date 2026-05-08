#!/bin/bash

# Blue-Green Deployment Script for CrewCanvas
# This script alternates deployment between port 8080 and 8081

# Improved Path Handling: Use current directory if $HOME/app is restricted
if [ -w "$HOME" ]; then
    APP_DIR="$HOME/app"
    mkdir -p "$APP_DIR"
else
    echo "Warning: $HOME is not writable. Using current directory for deployment."
    APP_DIR=$(pwd)
fi

cd "$APP_DIR"
CURRENT_PORT_FILE="$APP_DIR/current_port.txt"
JAR_NAME="crewcanvas.jar"

# Get current port, default to 8081 (so first deploy goes to 8080)
CURRENT_PORT=$(cat $CURRENT_PORT_FILE 2>/dev/null || echo "8081")

if [ "$CURRENT_PORT" == "8080" ]; then
    NEW_PORT=8081
else
    NEW_PORT=8080
fi

echo "----------------------------------------"
echo "Current port: $CURRENT_PORT"
echo "Deploying new version on port: $NEW_PORT"
echo "----------------------------------------"

# Ensure MySQL is running before starting the app
echo "Checking database connectivity..."
# Try to ping MySQL, if it fails, try to start the service
if ! mysqladmin ping -h 127.0.0.1 -u root -proot --silent; then
    echo "MySQL seems to be down. Attempting to start service..."
    sudo systemctl start mariadb || sudo systemctl start mysqld || sudo systemctl start mysql || echo "Warning: Could not start MySQL service automatically."
    sleep 5
fi

# Kill any existing process on the NEW_PORT
echo "Cleaning up port $NEW_PORT..."
sudo fuser -k $NEW_PORT/tcp || true
sleep 2

# Run the new version of the app
echo "Starting new instance on port $NEW_PORT..."
# Find the latest jar file
LATEST_JAR=$(ls -t *.jar | head -1)

nohup java \
  -Xms128m -Xmx320m \
  -XX:+UseSerialGC \
  -XX:MaxMetaspaceSize=128m \
  -jar $LATEST_JAR \
  --server.port=$NEW_PORT \
  > app-$NEW_PORT.log 2>&1 &

# Wait for the app to start and check health
echo "Waiting for application to start on port $NEW_PORT..."
MAX_RETRIES=30
RETRY_COUNT=0
HEALTH_CHECK_URL="http://localhost:$NEW_PORT/api/health" # Adjust if you have a health endpoint, otherwise use /

# Use a simpler health check if /api/health doesn't exist
if ! curl -s "http://localhost:$NEW_PORT/api/health" > /dev/null; then
    HEALTH_CHECK_URL="http://localhost:$NEW_PORT"
fi

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s $HEALTH_CHECK_URL > /dev/null; then
        echo "Application started successfully on port $NEW_PORT!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo "Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "ERROR: Application failed to start on port $NEW_PORT within timeout."
    echo "Check logs: app-$NEW_PORT.log"
    tail -n 50 app-$NEW_PORT.log
    exit 1
fi

# Update Nginx configuration
echo "Switching traffic in Nginx to port $NEW_PORT..."

# Try multiple common Nginx config locations
if [ -f "/etc/nginx/sites-available/default" ]; then
    NGINX_CONF="/etc/nginx/sites-available/default"
elif [ -f "/etc/nginx/conf.d/default.conf" ]; then
    NGINX_CONF="/etc/nginx/conf.d/default.conf"
elif [ -f "/etc/nginx/nginx.conf" ]; then
    NGINX_CONF="/etc/nginx/nginx.conf"
elif [ -f "/etc/nginx/conf.d/default" ]; then
    NGINX_CONF="/etc/nginx/conf.d/default"
elif [ -f "/etc/nginx/sites-enabled/default" ]; then
    NGINX_CONF="/etc/nginx/sites-enabled/default"
else
    echo "ERROR: Nginx configuration file not found. Checked standard locations."
    exit 1
fi

echo "Found Nginx config at: $NGINX_CONF"

# Backup Nginx config
sudo cp $NGINX_CONF ${NGINX_CONF}.bak

# Replace port in Nginx config - handle both localhost and 127.0.0.1, and optional trailing slashes
# Using 127.0.0.1 explicitly in the replacement to avoid IPv6 resolution issues (common cause of 502)
sudo sed -i "s/proxy_pass http:\/\/\(localhost\|127\.0\.0\.1\):[0-9]*/proxy_pass http:\/\/127.0.0.1:$NEW_PORT/g" $NGINX_CONF

# Verify the change
if grep -q ":$NEW_PORT" "$NGINX_CONF"; then
    echo "SUCCESS: Nginx configuration updated to port $NEW_PORT."
else
    echo "WARNING: Could not verify port update in $NGINX_CONF. Checking for other configuration files..."
    # Attempt to update any other potential config files in conf.d
    sudo sed -i "s/proxy_pass http:\/\/\(localhost\|127\.0\.0\.1\):[0-9]*/proxy_pass http:\/\/127.0.0.1:$NEW_PORT/g" /etc/nginx/conf.d/*.conf 2>/dev/null || true
fi

# Test and Reload Nginx
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "Nginx reloaded successfully. Traffic switched to port $NEW_PORT."
    
    # Update current port file
    echo $NEW_PORT > $CURRENT_PORT_FILE
    
    # Important: Stop the OLD version to free up memory
    echo "Stopping old instance on port $CURRENT_PORT..."
    sudo fuser -k $CURRENT_PORT/tcp || true
    
    echo "Deployment Complete!"
else
    echo "ERROR: Nginx configuration test failed. Reverting change..."
    sudo mv ${NGINX_CONF}.bak $NGINX_CONF
    exit 1
fi


