#!/bin/bash
# CrewCanvas Setup Script for Amazon Linux (EC2)
# Run with: sudo bash setup_linux.sh

echo "========================================"
echo "   CrewCanvas - Linux Setup Script"
echo "========================================"

# Update system
echo "[1/4] Updating system packages..."
sudo yum update -y

# Install Java 17 (Amazon Corretto)
echo "[2/4] Installing Java 17..."
sudo yum install java-17-amazon-corretto-devel -y

# Install Maven
echo "[3/4] Installing Maven..."
sudo yum install maven -y

# Install MySQL Client (to run scripts)
echo "[4/4] Installing MySQL..."
sudo yum install mysql -y

# Verify installations
echo "--- Verification ---"
java -version
mvn -version
mysql --version

echo ""
echo "Setup Complete! Next steps:"
echo "1. Configure your database (RDS or local MySQL)"
echo "2. Run 'bash run_linux.sh' to start the server"
echo "========================================"
