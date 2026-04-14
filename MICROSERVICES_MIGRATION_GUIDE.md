# CrewCanvas Microservices Migration Guide

## Architecture Overview
The application has been successfully converted from a Monolithic architecture to a Microservices architecture.

### Services
1.  **Eureka Server** (`8761`): Service Discovery.
2.  **API Gateway** (`8080`): Single Entry Point & Static File Server.
3.  **User Service** (`8081`): Manages Users, Auth, & Connections.
4.  **Event Service** (`8082`): Manages Events & Auditions.
5.  **Feed Service** (`8083`): Manages Posts & Social Feed.
6.  **Chat Service** (`8084`): Manages Real-time Messaging.

## Databases
Each service now has its own database to ensure loose coupling:
*   `crewcanvas_user_db`
*   `crewcanvas_event_db`
*   `crewcanvas_feed_db`
*   `crewcanvas_chat_db`

*Note: These will be created automatically when you run the services if your MySQL user has permissions.*

## How to Run
We have created a unified launcher script to handle everything.

1.  **Double-click** `run-microservices.bat` in the project root.
2.  Wait for all 6 windows to launch.
3.  Access the application at: **http://localhost:8080**

## Technical Changes
*   **Static Content**: Moved to `api-gateway/src/main/resources/static`.
*   **Frontend Logic**: JavaScript files (`feed.js`, `messages.js`) were updated to fetch User details dynamically, as `Post` and `Message` objects no longer directly contain `User` data.

## Troubleshooting
*   **Port Conflicts**: Ensure ports 8080-8084 and 8761 are free.
*   **Database**: Ensure MySQL is running on port 3306 with `root/root`.
