# 🎬 CrewCanvas - Film Industry Connection Platform

<div align="center">

**Where All Crafts Connect**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.2-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://adoptium.net/)
[![Maven](https://img.shields.io/badge/Maven-3.6+-red.svg)](https://maven.apache.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Quick Start](#quick-start)
4. [Documentation](#documentation)
5. [Project Structure](#project-structure)
6. [Technology Stack](#technology-stack)
7. [Screenshots](#screenshots)
8. [API Endpoints](#api-endpoints)
9. [Development](#development)
10. [Troubleshooting](#troubleshooting)
11. [Contributing](#contributing)
12. [License](#license)

---

## 🎯 Overview

**CrewCanvas** is a modern web platform designed to connect film industry professionals. Built with Spring Boot and featuring a vibrant orange theme, it provides a seamless experience for filmmakers, actors, crew members, and industry professionals to collaborate.

### Key Highlights
- 🎨 **Modern Orange Theme** - Eye-catching gradient design
- 🚀 **Spring Boot Backend** - Robust and scalable
- 💾 **H2 Database** - Quick development setup
- 📱 **Responsive Design** - Works on all devices
- 🔐 **Authentication Ready** - Login/Signup system

---

## ✨ Features

### Current Features (v0.0.1)
- ✅ User authentication UI (Login/Signup)
- ✅ Orange gradient theme throughout
- ✅ Tab switching with smooth animations
- ✅ Form validation
- ✅ Responsive mobile design
- ✅ REST API endpoints
- ✅ H2 database integration
- ✅ Modern card-based UI

### Planned Features
- 🔜 User profiles with portfolios
- 🔜 Project/audition listings
- 🔜 Real-time messaging
- 🔜 Search and filters
- 🔜 File uploads (photos/videos)
- 🔜 JWT authentication
- 🔜 Email notifications
- 🔜 Social connections (follow/unfollow)

---

## 🚀 Quick Start

### Prerequisites
- **Java 17** or higher
- **Maven 3.6+**
- A web browser

### Installation

1. **Clone or download the project**
```bash
cd d:\Springbootcrewcanvas
```

2. **Build the project**
```bash
mvn clean package
```
*Or double-click `build.bat`*

3. **Run the application**
```bash
mvn spring-boot:run
```
*Or double-click `run.bat`*

4. **Access the application**
```
http://localhost:8080
```

### First Time Setup

If you don't have Java or Maven installed, see **[SETUP_GUIDE.md](SETUP_GUIDE.md)** for detailed instructions.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[QUICK_START.md](QUICK_START.md)** | Get started in 3 steps |
| **[SETUP_GUIDE.md](SETUP_GUIDE.md)** | Detailed installation guide |
| **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** | Visual project overview |
| **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** | REST API reference |
| **[STEP_BY_STEP_PROMPTS.md](STEP_BY_STEP_PROMPTS.md)** | Rebuild guide |

---

## 📁 Project Structure

```
CrewCanvas/
├── 📄 pom.xml                          # Maven configuration
├── 📄 README.md                        # This file
├── 📄 QUICK_START.md                   # Quick start guide
├── 📄 SETUP_GUIDE.md                   # Setup instructions
├── 📄 PROJECT_STRUCTURE.md             # Project overview
├── 📄 API_DOCUMENTATION.md             # API docs
├── 📄 STEP_BY_STEP_PROMPTS.md         # Rebuild prompts
├── 📄 .gitignore                       # Git ignore rules
├── 📄 run.bat                          # Run script
├── 📄 build.bat                        # Build script
│
├── 📁 src/
│   ├── 📁 main/
│   │   ├── 📁 java/com/crewcanvas/
│   │   │   ├── 📄 CrewCanvasApplication.java
│   │   │   └── 📁 controller/
│   │   │       └── 📄 AuthController.java
│   │   │
│   │   └── 📁 resources/
│   │       ├── 📄 application.properties
│   │       └── 📁 static/
│   │           ├── 📄 index.html
│   │           ├── 📁 css/
│   │           │   ├── 📄 auth.css
│   │           │   └── 📄 main.css
│   │           └── 📁 js/
│   │               └── 📄 auth.js
│   │
│   └── 📁 test/
│
└── 📁 target/                          # Build output
```

---

## 🛠️ Technology Stack

### Backend
- **Spring Boot 3.2.2** - Application framework
- **Spring Web** - REST API
- **Spring Data JPA** - Database access
- **H2 Database** - In-memory database
- **Maven** - Build tool

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with gradients and animations
- **JavaScript (ES6)** - Interactivity
- **Google Fonts** - Poppins typography

### Tools
- **Java 17** - Programming language
- **Git** - Version control

---

## 🎨 Screenshots

### Login Page
```
┌────────────────────────────────────┐
│     🎬 CrewCanvas                  │
│   Where all crafts connect         │
│                                    │
│  [Login] [Sign Up]                │
│   ▓▓▓▓▓                           │
│                                    │
│  📧 Email                          │
│  🔒 Password                       │
│                                    │
│  [      Login      ]              │
│   (Orange Gradient)               │
└────────────────────────────────────┘
```

*See PROJECT_STRUCTURE.md for detailed UI mockups*

---

## 🔌 API Endpoints

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Signup
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

*See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference*

---

## 💻 Development

### Running in Development Mode

```bash
mvn spring-boot:run
```

### Building for Production

```bash
mvn clean package
java -jar target/crewcanvas-0.0.1-SNAPSHOT.jar
```

### Accessing H2 Console

```
URL: http://localhost:8080/h2-console
JDBC URL: jdbc:h2:mem:crewcanvas_db
Username: sa
Password: password
```

### Hot Reload

Add Spring DevTools to `pom.xml` for automatic restart:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
</dependency>
```

---

## 🎨 Color Scheme

```css
/* Primary Colors */
--primary-orange:    #ff8800  /* Main brand color */
--secondary-orange:  #ff6a00  /* Hover states */
--accent-pink:       #ff2d55  /* Gradient accent */

/* Backgrounds */
--dark-bg:           #222     /* Page background */
--light-bg:          #fff     /* Card background */

/* Text */
--text-dark:         #444     /* Dark text */
--text-light:        #fff     /* Light text */
```

---

## 🐛 Troubleshooting

### Port Already in Use
```properties
# Change in application.properties
server.port=3000
```

### CSS Not Loading
```bash
# Clear cache and rebuild
mvn clean package
# Then refresh browser with Ctrl+Shift+R
```

### Build Fails
```bash
# Verify installations
java -version    # Should be 17+
mvn -version     # Should be 3.6+

# Clean and rebuild
mvn clean install
```

### Java/Maven Not Found
See **[SETUP_GUIDE.md](SETUP_GUIDE.md)** for installation instructions.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Authors

- **CrewCanvas Team** - *Initial work*

---

## 🙏 Acknowledgments

- Spring Boot team for the excellent framework
- Google Fonts for Poppins font
- Film industry professionals for inspiration

---

## 📞 Support

For support, please:
1. Check the documentation files
2. Review troubleshooting section
3. Check console logs for errors
4. Open an issue on GitHub

---

## 🗺️ Roadmap

### Phase 1 (Current) - Foundation ✅
- [x] Project setup
- [x] Authentication UI
- [x] Orange theme
- [x] Basic API endpoints

### Phase 2 - Core Features 🔄
- [ ] User profiles
- [ ] Database models
- [ ] JWT authentication
- [ ] Password encryption

### Phase 3 - Social Features 📅
- [ ] User connections
- [ ] Messaging system
- [ ] Feed/timeline
- [ ] Search functionality

### Phase 4 - Advanced Features 🔮
- [ ] File uploads
- [ ] Project listings
- [ ] Audition postings
- [ ] Email notifications

---

## 📊 Project Status

**Current Version:** 0.0.1-SNAPSHOT  
**Status:** In Development  
**Last Updated:** February 5, 2026

---

<div align="center">

**Built with ❤️ for the Film Industry**

[Documentation](QUICK_START.md) • [API Docs](API_DOCUMENTATION.md) • [Setup Guide](SETUP_GUIDE.md)

</div>
