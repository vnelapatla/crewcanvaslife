#!/bin/bash
# CrewCanvas Run Script for Amazon Linux
# Run with: bash run_linux.sh

echo "========================================"
echo "   CrewCanvas - Starting Server"
echo "========================================"

# Build the project
echo "Building project with Maven..."
mvn clean package -DskipTests

if [ $? -ne 0 ]; then
    echo "ERROR: Build failed!"
    exit 1
fi


# Kill any existing process on port 8081
echo "Cleaning up port 8081..."
fuser -k 8081/tcp 2>/dev/null

# Run in background with nohup - Optimized for 1GB RAM Instance (768MB Heap)
echo "Starting Spring Boot application in background..."
nohup java -Xms256m -Xmx768m -jar target/*.jar > app.log 2>&1 &

echo ""
echo "Server is starting!"
echo "- Logs: tail -f app.log"
echo "- PID: $!"
echo "========================================"
