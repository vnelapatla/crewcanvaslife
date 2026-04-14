# CrewCanvas - Project Structure & Visual Guide

## 📁 Complete Project Structure

```
d:/Springbootcrewcanvas/
│
├── 📄 pom.xml                          # Maven configuration
├── 📄 README.md                        # Project documentation
├── 📄 SETUP_GUIDE.md                   # Installation guide
│
├── 📁 src/
│   ├── 📁 main/
│   │   ├── 📁 java/
│   │   │   └── 📁 com/
│   │   │       └── 📁 crewcanvas/
│   │   │           ├── 📄 CrewCanvasApplication.java    # Main app
│   │   │           └── 📁 controller/
│   │   │               └── 📄 AuthController.java       # REST API
│   │   │
│   │   └── 📁 resources/
│   │       ├── 📄 application.properties                # Configuration
│   │       └── 📁 static/
│   │           ├── 📄 index.html                        # Login page
│   │           ├── 📁 css/
│   │           │   ├── 📄 auth.css                      # Auth styling
│   │           │   └── 📄 main.css                      # Main theme
│   │           └── 📁 js/
│   │               └── 📄 auth.js                       # Auth logic
│   │
│   └── 📁 test/
│       └── 📁 java/
│           └── 📁 com/
│               └── 📁 crewcanvas/
│
└── 📁 target/                          # Build output (created after mvn package)
    └── 📄 crewcanvas-0.0.1-SNAPSHOT.jar
```

---

## 🎨 Visual Design Preview

### Login/Signup Page (index.html)

```
┌────────────────────────────────────────────────┐
│                                                │
│         Dark Background (#222)                 │
│                                                │
│    ┌──────────────────────────────────┐       │
│    │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← Orange gradient
│    │                                  │       │
│    │        CrewCanvas                │       │
│    │     (C letters in orange)        │       │
│    │   Where all crafts connect       │  ← Orange tagline
│    │                                  │       │
│    │  ┌─────────┐  ┌─────────┐      │       │
│    │  │ Login   │  │ Sign Up │      │  ← Tabs
│    │  └─────────┘  └─────────┘      │       │
│    │     ▓▓▓▓▓▓                      │  ← Orange underline
│    │                                  │       │
│    │  ┌──────────────────────────┐  │       │
│    │  │ 📧 Email                 │  │       │
│    │  └──────────────────────────┘  │       │
│    │                                  │       │
│    │  ┌──────────────────────────┐  │       │
│    │  │ 🔒 Password              │  │       │
│    │  └──────────────────────────┘  │       │
│    │                                  │       │
│    │  ┌──────────────────────────┐  │       │
│    │  │      Login               │  │  ← Orange gradient button
│    │  │  (Orange → Pink)         │  │       │
│    │  └──────────────────────────┘  │       │
│    │                                  │       │
│    └──────────────────────────────────┘       │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 🎨 Color Palette

### Primary Colors
```css
--primary-orange:    #ff8800  ████████  Main orange
--secondary-orange:  #ff6a00  ████████  Hover states
--accent-pink:       #ff2d55  ████████  Gradient accent
```

### Backgrounds
```css
--dark-bg:           #222     ████████  Page background
--light-bg:          #fff     ████████  Card background
```

### Text
```css
--text-dark:         #444     ████████  Dark text
--text-light:        #fff     ████████  Light text
```

---

## 🎯 Key Features Implemented

### ✅ Backend (Spring Boot)
- [x] Spring Boot 3.2.2 setup
- [x] H2 in-memory database
- [x] JPA configuration
- [x] REST API endpoints (/api/auth/login, /api/auth/signup)
- [x] CORS enabled
- [x] H2 console enabled

### ✅ Frontend (HTML/CSS/JS)
- [x] Orange-themed design
- [x] Responsive login/signup page
- [x] Tab switching functionality
- [x] Form validation
- [x] Orange gradient buttons
- [x] Focus states with orange glow
- [x] Smooth animations
- [x] Google Fonts (Poppins)

### ✅ Configuration
- [x] Application properties
- [x] Maven dependencies
- [x] Project structure
- [x] Documentation

---

## 🚀 How to Run (After Installing Java & Maven)

### Step 1: Build
```bash
cd d:\Springbootcrewcanvas
mvn clean package
```

### Step 2: Run
```bash
mvn spring-boot:run
```

### Step 3: Access
```
http://localhost:8080
```

---

## 📱 Responsive Design

The application is designed to work on:
- 💻 Desktop (1920px+)
- 💻 Laptop (1366px+)
- 📱 Tablet (768px+)
- 📱 Mobile (375px+)

---

## 🔧 Technology Stack

```
┌─────────────────────────────────────┐
│         Frontend Layer              │
│  HTML5 + CSS3 + JavaScript          │
│  (Orange Theme + Animations)        │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│         Backend Layer               │
│  Spring Boot 3.2.2                  │
│  Spring Web + Spring Data JPA       │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│         Database Layer              │
│  H2 In-Memory Database              │
│  (Development)                      │
└─────────────────────────────────────┘
```

---

## 📊 API Endpoints

### Authentication
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

```
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

---

## 🎨 UI Components

### Buttons
- **Primary Button**: Orange gradient (#ff8800 → #ff2d55)
- **Hover Effect**: Slight lift (translateY -2px)
- **Active State**: Pressed effect

### Input Fields
- **Default**: Light gray border (#e0e0e0)
- **Focus**: Orange border + glow effect
- **Border Radius**: 10px

### Cards
- **Background**: White with 95% opacity
- **Border Radius**: 20px
- **Top Border**: Orange gradient stripe
- **Shadow**: Soft shadow for depth

### Tabs
- **Active**: Orange text + orange underline
- **Inactive**: Gray text
- **Transition**: Smooth 0.3s

---

## 📝 Next Development Steps

1. **User Management**
   - Create User entity
   - Implement Spring Security
   - Add JWT authentication

2. **Additional Pages**
   - Home/Feed page
   - Profile page
   - Search page
   - Messaging page

3. **Database**
   - Switch to PostgreSQL/MySQL
   - Add migrations
   - Create relationships

4. **Features**
   - File upload
   - Real-time messaging
   - Notifications
   - Search functionality

---

## 🎯 Current Status

✅ **COMPLETED:**
- Project structure created
- Spring Boot configured
- Orange theme implemented
- Login/Signup UI created
- REST API skeleton ready
- Documentation complete

⚠️ **PENDING:**
- Java 17 installation
- Maven installation
- First build & run

---

## 📖 Files Created Summary

| File | Purpose | Status |
|------|---------|--------|
| pom.xml | Maven configuration | ✅ Created |
| application.properties | App configuration | ✅ Created |
| CrewCanvasApplication.java | Main application | ✅ Created |
| AuthController.java | REST API | ✅ Created |
| index.html | Login page | ✅ Created |
| auth.css | Auth styling | ✅ Created |
| main.css | Main theme | ✅ Created |
| auth.js | Auth logic | ✅ Created |
| README.md | Documentation | ✅ Created |
| SETUP_GUIDE.md | Setup instructions | ✅ Created |

---

**All files are ready! Install Java 17 and Maven to start the application.**
