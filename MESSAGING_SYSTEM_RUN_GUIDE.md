# WhatsApp-like Messaging System - Run Instructions

## 1. Database Setup (MySQL)
Execute the `schema.sql` file located in `chat-service/src/main/resources/schema.sql`.
This will create the following tables:
- `users`
- `conversations`
- `conversation_participants`
- `messages`

It also inserts 3 sample users:
- User 1: John Doe
- User 2: Jane Smith
- User 3: Michael Scott

## 2. Backend Config (Spring Boot)
Ensure your `application.properties` in `chat-service` has the correct MySQL credentials:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/your_db_name
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
```

## 3. Running the Backend
Run the `chat-service` using Maven:
```bash
mvn spring-boot:run
```
The server will start on `http://localhost:8084`.

## 4. Running the Frontend
Simply open `chat-ui/index.html` in your browser.

To test real-time chat between two users:
1. Open `index.html?userId=1` (John Doe) in one tab.
2. Open `index.html?userId=2` (Jane Smith) in another tab/browser.
3. Start messaging!

## Project Structure
- `chat-service/`: Spring Boot Maven project.
  - `model/`: JPA Entities (User, Conversation, Message, etc.)
  - `repository/`: Data Access Interfaces.
  - `service/`: Business logic.
  - `controller/`: REST & WebSocket handlers.
  - `messaging/`: WebSocket configuration.
- `chat-ui/`: Vanilla Frontend.
  - `index.html`: Responsive layout.
  - `style.css`: Premium WhatsApp aesthetics.
  - `chat.js`: Real-time and API logic.
