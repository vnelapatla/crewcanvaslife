#!/bin/bash
# CrewCanvas Service Installer
# This script sets up the application as a system service for auto-restart.

echo "----------------------------------------"
echo "🛠️ Installing CrewCanvas System Service..."
echo "----------------------------------------"

SERVICE_FILE="crewcanvas.service"
TARGET_PATH="/etc/systemd/system/crewcanvas.service"

if [ ! -f "$SERVICE_FILE" ]; then
    echo "❌ Error: $SERVICE_FILE not found in current directory."
    exit 1
fi

# Detect current user and path
CURRENT_USER=$(whoami)
CURRENT_DIR=$(pwd)

echo "📝 Customizing service for user '$CURRENT_USER' and path '$CURRENT_DIR'..."

# Create a temporary version with correct paths
cp $SERVICE_FILE crewcanvas.service.tmp
sed -i "s|User=ec2-user|User=$CURRENT_USER|g" crewcanvas.service.tmp
sed -i "s|WorkingDirectory=/home/ec2-user/app|WorkingDirectory=$CURRENT_DIR|g" crewcanvas.service.tmp

# Find the latest jar to use in the service
LATEST_JAR=$(ls -t *.jar 2>/dev/null | head -1)
if [ -n "$LATEST_JAR" ]; then
    echo "📦 Using $LATEST_JAR for service startup."
    sed -i "s|crewcanvas.jar|$LATEST_JAR|g" crewcanvas.service.tmp
else
    echo "⚠️ Warning: No .jar file found. You might need to update the service file manually after building."
fi

# Install
echo "🚚 Moving service file to system directory..."
sudo mv crewcanvas.service.tmp $TARGET_PATH

# Reload and Enable
echo "🔄 Reloading systemd daemon..."
sudo systemctl daemon-reload
echo "🚀 Enabling crewcanvas service..."
sudo systemctl enable crewcanvas

echo "----------------------------------------"
echo "✅ Service Installed Successfully!"
echo "----------------------------------------"
echo "You can now manage the app with:"
echo "  sudo systemctl start crewcanvas"
echo "  sudo systemctl stop crewcanvas"
echo "  sudo systemctl status crewcanvas"
echo "----------------------------------------"
