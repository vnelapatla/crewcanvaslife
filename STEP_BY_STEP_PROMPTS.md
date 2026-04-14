# CrewCanvas - Step-by-Step Build Prompts
## Copy these prompts one by one in a new conversation

---

## PROMPT 1: Initialize Project
```
Create a new Spring Boot project with these specifications:
- Project name: CrewCanvas
- Group: com.crewcanvas
- Artifact: crewcanvas
- Java version: 17
- Spring Boot version: 3.2.2
- Dependencies: Spring Web, Spring Data JPA, H2 Database
- Create the basic folder structure for a Spring Boot application
```

---

## PROMPT 2: Create Main Application Class
```
Create the main Spring Boot application class:
- Package: com.crewcanvas
- Class name: CrewCanvasApplication
- Add @SpringBootApplication annotation
- Include main method that runs SpringApplication
- Add a console message that prints "CrewCanvas is running!" and "Open: http://localhost:8080"
```

---

## PROMPT 3: Configure POM.xml
```
Create a minimal pom.xml file with:
- Parent: spring-boot-starter-parent version 3.2.2
- Group ID: com.crewcanvas
- Artifact ID: crewcanvas
- Version: 1.0.0
- Dependencies: spring-boot-starter-web, spring-boot-starter-data-jpa, h2 database
- Build plugin: spring-boot-maven-plugin
- Java version: 17
```

---

## PROMPT 4: Configure Application Properties
```
Create application.properties file with:
- Application name: crewcanvas
- Server port: 8080
- H2 database configuration (in-memory)
- Enable H2 console
- JPA hibernate ddl-auto: update
- Show SQL queries: true
```

---

## PROMPT 5: Create Orange-Themed CSS
```
Create a CSS file named auth.css in src/main/resources/static/css/ with:
- Orange color scheme: primary #ff8800, secondary #ff6a00, accent #ff2d55
- Dark gradient background
- Modern card design with rounded corners
- Orange gradient top border on cards
- Tab switching styles with orange active state
- Input fields with orange focus states
- Orange gradient buttons with hover effects
- Responsive design for mobile
- Use Poppins font family
```

---

## PROMPT 6: Create Login/Signup HTML Page
```
Create index.html in src/main/resources/static/ with:
- Two tabs: Login and Sign Up
- Logo with "CrewCanvas" where C letters are orange
- Tagline: "Where all crafts connect"
- Login form with: email, password fields, forgot password link
- Signup form with: name, email, password, confirm password fields
- Orange gradient submit buttons
- Link to auth.css stylesheet
- Link to Google Fonts (Poppins)
- Link to auth.js script
```

---

## PROMPT 7: Create Authentication JavaScript
```
Create auth.js in src/main/resources/static/js/ with:
- Tab switching functionality (between login and signup)
- Login form submission handler with validation
- Signup form submission handler with password matching validation
- Console logging for debugging
- Alert messages for demo mode
- Helper function to show success/error messages
- Prevent default form submission
```

---

## PROMPT 8: Create User Entity (Optional - for database)
```
Create a User entity class in com.crewcanvas.model package with:
- Fields: id (Long), name (String), email (String), password (String), createdAt (LocalDateTime)
- JPA annotations: @Entity, @Id, @GeneratedValue
- Getters and setters (or use Lombok @Data)
```

---

## PROMPT 9: Create User Repository (Optional)
```
Create UserRepository interface in com.crewcanvas.repository package:
- Extend JpaRepository<User, Long>
- Add method: findByEmail(String email)
```

---

## PROMPT 10: Create Auth Controller (Optional)
```
Create AuthController in com.crewcanvas.controller package with:
- @RestController annotation
- @RequestMapping("/api/auth")
- POST endpoint /login - accepts email and password
- POST endpoint /signup - accepts name, email, password
- Return simple success messages for now
```

---

## PROMPT 11: Build and Run
```
Create a batch file named RUN.bat that:
1. Kills any running Java processes
2. Runs: mvn clean package -DskipTests
3. Runs: mvn spring-boot:run
4. Shows message: "Open browser: http://localhost:8080"
```

---

## PROMPT 12: Test the Application
```
After running the application:
1. Open browser to http://localhost:8080
2. Verify the orange-themed login page appears
3. Test tab switching between Login and Sign Up
4. Test form validation
5. Check that buttons have orange gradient
6. Verify responsive design on mobile view
```

---

## COLOR SCHEME REFERENCE
Use these exact colors throughout:
- Primary Orange: #ff8800
- Secondary Orange: #ff6a00
- Accent Pink: #ff2d55
- Dark Background: #1a1a1a to #2d2d2d (gradient)
- Text Dark: #333
- Text Light: #fff

---

## TROUBLESHOOTING PROMPTS

### If port 8080 is in use:
```
Change the server port in application.properties to 3000 or 9090
```

### If CSS doesn't load:
```
1. Verify the CSS file is in src/main/resources/static/css/
2. Run: mvn clean package
3. Clear browser cache (Ctrl+Shift+R)
4. Check browser console for errors
```

### If build fails:
```
1. Verify Java 17 is installed: java -version
2. Verify Maven is installed: mvn -version
3. Delete the target folder
4. Run: mvn clean install
```

### If page shows "Access Denied":
```
This means another service is using port 8080.
Change the port in application.properties to a different number like 3000, 8081, or 9090
```

---

## USAGE INSTRUCTIONS

1. **Start a NEW conversation**
2. **Copy PROMPT 1** and paste it
3. **Wait for the AI to complete** that step
4. **Copy PROMPT 2** and paste it
5. **Continue through all prompts** in order
6. **Use troubleshooting prompts** if you encounter issues

Each prompt is designed to be self-contained and clear about what needs to be created.

---

## EXPECTED RESULT

After completing all prompts, you will have:
✅ A working Spring Boot application
✅ Orange-themed login/signup page
✅ Tab switching functionality
✅ Form validation
✅ Responsive design
✅ Professional UI with gradient buttons
✅ Database ready for user storage
✅ REST API endpoints (optional)

---

## NEXT STEPS AFTER BASIC BUILD

Once the basic application is working, you can extend it with:
- Home page with user feed
- Profile pages
- Search functionality
- Messaging system
- Project/audition listings
- File upload for profile pictures
- JWT authentication
- Password encryption
- Email verification

---

**Save this file and use it as your guide for building CrewCanvas from scratch!**
