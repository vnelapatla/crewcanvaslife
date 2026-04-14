# CrewCanvas - API Documentation

## Base URL
```
http://localhost:8080/api
```

---

## Authentication Endpoints

### 1. User Login

**Endpoint:** `POST /auth/login`

**Description:** Authenticate a user with email and password

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
"Login successful"
```

**Status Codes:**
- `200 OK` - Login successful
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Invalid credentials (to be implemented)

**Example using curl:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Example using JavaScript:**
```javascript
fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
})
.then(response => response.text())
.then(data => console.log(data));
```

---

### 2. User Signup

**Endpoint:** `POST /auth/signup`

**Description:** Register a new user

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
"Signup successful"
```

**Status Codes:**
- `200 OK` - Signup successful
- `400 Bad Request` - Invalid request body
- `409 Conflict` - Email already exists (to be implemented)

**Example using curl:**
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

**Example using JavaScript:**
```javascript
fetch('http://localhost:8080/api/auth/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123'
  })
})
.then(response => response.text())
.then(data => console.log(data));
```

---

## Request/Response Models

### LoginRequest
```java
{
  "email": "string",      // Required, valid email format
  "password": "string"    // Required, min 6 characters
}
```

### SignupRequest
```java
{
  "name": "string",       // Required, min 2 characters
  "email": "string",      // Required, valid email format
  "password": "string"    // Required, min 6 characters
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "timestamp": "2026-02-05T14:21:27.000+00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/auth/login"
}
```

### 500 Internal Server Error
```json
{
  "timestamp": "2026-02-05T14:21:27.000+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "An error occurred",
  "path": "/api/auth/login"
}
```

---

## CORS Configuration

CORS is enabled for all origins (`*`). In production, restrict to specific domains:

```java
@CrossOrigin(origins = "https://crewcanvas.com")
```

---

## Future Endpoints (To Be Implemented)

### User Management
- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/{id}` - Update user profile
- `DELETE /api/users/{id}` - Delete user account
- `GET /api/users/search?q={query}` - Search users

### Posts/Feed
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/{id}` - Get specific post
- `PUT /api/posts/{id}` - Update post
- `DELETE /api/posts/{id}` - Delete post

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get specific project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Messaging
- `GET /api/messages` - Get user messages
- `POST /api/messages` - Send message
- `GET /api/messages/{id}` - Get specific message
- `DELETE /api/messages/{id}` - Delete message

### Connections
- `POST /api/connections/follow/{userId}` - Follow user
- `DELETE /api/connections/unfollow/{userId}` - Unfollow user
- `GET /api/connections/followers` - Get followers
- `GET /api/connections/following` - Get following

---

## Testing with Postman

### Setup
1. Create new collection: "CrewCanvas API"
2. Set base URL variable: `{{baseUrl}}` = `http://localhost:8080/api`

### Test Login
1. Create new request: "Login"
2. Method: POST
3. URL: `{{baseUrl}}/auth/login`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

### Test Signup
1. Create new request: "Signup"
2. Method: POST
3. URL: `{{baseUrl}}/auth/signup`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

---

## Security Notes

⚠️ **Current Implementation:**
- No authentication validation
- Passwords stored in plain text (DO NOT USE IN PRODUCTION)
- No rate limiting
- CORS open to all origins

🔒 **Production Requirements:**
- Implement JWT authentication
- Hash passwords with BCrypt
- Add rate limiting
- Restrict CORS to specific domains
- Add input validation
- Implement HTTPS
- Add request logging
- Implement refresh tokens

---

## Database Schema (H2)

### Users Table (To Be Created)
```sql
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Access H2 Console: http://localhost:8080/h2-console

---

## Development Tips

1. **Enable SQL Logging:** Already enabled in `application.properties`
2. **Test with Browser Console:**
```javascript
// Quick test from browser console
fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email:'test@test.com', password:'test123'})
}).then(r => r.text()).then(console.log);
```

3. **Monitor Logs:** Watch console output for SQL queries and errors

---

## Version History

- **v0.0.1** - Initial API setup with basic auth endpoints

---

**API is ready for testing! Start the server and try the endpoints.**
