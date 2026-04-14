# CrewCanvas - Complete Setup Guide

## ⚠️ IMPORTANT: Prerequisites Installation Required

Your system currently does not have Java and Maven installed. Follow these steps:

---

## Step 1: Install Java 17

### Option A: Using Chocolatey (Recommended for Windows)
```bash
# Install Chocolatey first (if not installed)
# Run PowerShell as Administrator and execute:
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Then install Java 17
choco install openjdk17 -y
```

### Option B: Manual Installation
1. Download Java 17 from: https://adoptium.net/
2. Choose "Temurin 17 (LTS)"
3. Download the Windows installer (.msi)
4. Run the installer
5. **IMPORTANT**: Check "Add to PATH" during installation

### Verify Java Installation
```bash
java -version
# Should show: openjdk version "17.x.x"
```

---

## Step 2: Install Maven

### Option A: Using Chocolatey
```bash
choco install maven -y
```

### Option B: Manual Installation
1. Download Maven from: https://maven.apache.org/download.cgi
2. Download the "Binary zip archive" (apache-maven-3.x.x-bin.zip)
3. Extract to `C:\Program Files\Apache\maven`
4. Add to PATH:
   - Open "Environment Variables"
   - Add `C:\Program Files\Apache\maven\bin` to PATH
   - Add new variable: `MAVEN_HOME` = `C:\Program Files\Apache\maven`

### Verify Maven Installation
```bash
mvn -version
# Should show: Apache Maven 3.x.x
```

---

## Step 3: Build the Project

Once Java and Maven are installed:

```bash
# Navigate to project directory
cd d:\Springbootcrewcanvas

# Clean and build
mvn clean package
```

---

## Step 4: Run the Application

### Option A: Using Maven
```bash
mvn spring-boot:run
```

### Option B: Using JAR file
```bash
java -jar target/crewcanvas-0.0.1-SNAPSHOT.jar
```

---

## Step 5: Access the Application

Open your browser and navigate to:
- **Main App**: http://localhost:8080
- **H2 Console**: http://localhost:8080/h2-console

---

## Alternative: Use Spring Tool Suite (STS) or IntelliJ IDEA

If you prefer an IDE:

### IntelliJ IDEA (Recommended)
1. Download IntelliJ IDEA Community Edition (free)
2. Open the project folder
3. IntelliJ will auto-detect it's a Maven project
4. Click "Run" → "Run CrewCanvasApplication"

### Spring Tool Suite (STS)
1. Download STS from: https://spring.io/tools
2. Import as "Existing Maven Project"
3. Right-click project → "Run As" → "Spring Boot App"

### VS Code
1. Install "Extension Pack for Java"
2. Install "Spring Boot Extension Pack"
3. Open project folder
4. Press F5 to run

---

## Project Files Created

✅ **Backend:**
- `pom.xml` - Maven configuration
- `CrewCanvasApplication.java` - Main application
- `AuthController.java` - REST API controller
- `application.properties` - Configuration

✅ **Frontend:**
- `index.html` - Login/Signup page
- `css/auth.css` - Authentication styling
- `css/main.css` - Main theme CSS
- `js/auth.js` - Authentication logic

✅ **Documentation:**
- `README.md` - Project documentation
- `SETUP_GUIDE.md` - This file

---

## Quick Test (Without Building)

You can test the frontend without running the backend:

1. Open `src/main/resources/static/index.html` directly in a browser
2. The login/signup UI will work
3. API calls won't work until backend is running

---

## Troubleshooting

### "Java not found"
- Restart your terminal/command prompt after installation
- Verify PATH includes Java bin directory
- Run: `echo %PATH%` and check for Java

### "Maven not found"
- Restart terminal after installation
- Verify MAVEN_HOME is set
- Run: `echo %MAVEN_HOME%`

### Port 8080 already in use
Edit `application.properties`:
```properties
server.port=3000
```

### Build errors
```bash
# Clean everything and rebuild
mvn clean
mvn package
```

---

## Next Steps After Setup

1. ✅ Install Java 17
2. ✅ Install Maven
3. ✅ Build the project
4. ✅ Run the application
5. ✅ Test at http://localhost:8080
6. 🚀 Start developing!

---

## Color Scheme Reference

**Primary Colors:**
- Orange: `#ff8800`
- Secondary Orange: `#ff6a00`
- Accent Pink: `#ff2d55`

**Backgrounds:**
- Dark: `#222`
- Light: `#fff`

**Text:**
- Dark: `#444`
- Light: `#fff`

---

## Support

If you encounter issues:
1. Check Java version: `java -version` (must be 17+)
2. Check Maven version: `mvn -version` (must be 3.6+)
3. Verify project structure matches the guide
4. Check logs in terminal for error messages

---

**Your CrewCanvas project is ready! Just install Java and Maven to get started.**
