# 🚀 CrewCanvas - Quick Start Guide

## ✅ Prerequisites Check

Before starting, ensure you have:
- ✅ **Java 17** installed
- ✅ **MySQL** installed and running
- ✅ **Eclipse IDE** installed
- ✅ **Maven** (usually comes with Eclipse)

---

## 📋 Step-by-Step Setup

### **Step 1: Verify MySQL is Running**

Open Command Prompt and run:
```bash
sc query MySQL80
```

You should see: `STATE: 4 RUNNING`

If not running, start it:
```bash
net start MySQL80
```

---

### **Step 2: Import Project into Eclipse**

1. Open **Eclipse IDE**
2. Click **File** → **Import...**
3. Expand **Maven** → Select **Existing Maven Projects**
4. Click **Next**
5. Click **Browse...** → Navigate to `d:\Springbootcrewcanvas`
6. Click **Select Folder**
7. Ensure `/pom.xml` is checked
8. Click **Finish**

**Wait for Eclipse to import the project** (30-60 seconds)

---

### **Step 3: Update Maven Dependencies**

1. In **Project Explorer**, right-click on **crewcanvas** project
2. Select **Maven** → **Update Project...**
3. Check **Force Update of Snapshots/Releases**
4. Click **OK**

**Wait for Maven to download dependencies** (2-5 minutes first time)

You'll see progress in the bottom-right corner of Eclipse.

---

### **Step 4: Verify Project Structure**

In Project Explorer, you should see:
```
crewcanvas
├── src/main/java
│   └── com.crewcanvas
│       ├── CrewCanvasApplication.java
│       ├── controller (6 files)
│       ├── model (6 files)
│       ├── repository (6 files)
│       └── service (6 files)
├── src/main/resources
│   ├── application.properties
│   └── static
│       ├── index.html
│       ├── feed.html
│       ├── home.html
│       ├── css (4 files)
│       └── js (3 files)
└── pom.xml
```

---

### **Step 5: Run the Application**

1. Navigate to: `src/main/java` → `com.crewcanvas` → `CrewCanvasApplication.java`
2. **Right-click** on `CrewCanvasApplication.java`
3. Select **Run As** → **Java Application**

---

### **Step 6: Watch the Console**

You should see output like this:

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.2.2)

...
HikariPool-1 - Starting...
HikariPool-1 - Start completed.
Hibernate: create table users (...)
Hibernate: create table posts (...)
Hibernate: create table messages (...)
Hibernate: create table events (...)
Hibernate: create table projects (...)
Hibernate: create table connections (...)
...
Started CrewCanvasApplication in 8.234 seconds
Tomcat started on port(s): 8080 (http)
```

**✅ If you see this, the application is running!**

---

### **Step 7: Open in Browser**

Open your web browser and go to:
```
http://localhost:8080
```

You should see the **CrewCanvas Login Page** with orange theme!

---

## 🧪 Testing the Application

### **Test 1: Create an Account**

1. Click the **"Sign Up"** tab
2. Fill in:
   - **Name:** John Doe
   - **Email:** john@test.com
   - **Password:** test123
   - **Confirm Password:** test123
3. Click **"Sign Up"**
4. You should see: "Signup successful! Welcome John Doe"

---

### **Test 2: Login**

1. Click the **"Login"** tab
2. Enter:
   - **Email:** john@test.com
   - **Password:** test123
3. Click **"Login"**
4. You should be redirected to the **Dashboard**

---

### **Test 3: View Dashboard**

You should see:
- Welcome message: "Welcome back, John Doe! 🎬"
- Stats cards showing 0 for all (new user)
- Suggested connections section
- Upcoming events section

---

### **Test 4: Create a Post**

1. Click **"Feed"** in the sidebar
2. In the "Create a Post" section, type:
   ```
   Hello CrewCanvas! Excited to connect with film professionals! 🎬
   ```
3. (Optional) Click **"📷 Add Image"** to upload an image
4. Click **"Post"**
5. Your post should appear in the feed below!

---

### **Test 5: Interact with Posts**

1. Click the **❤️** button to like your post
2. Click the **💬** button to add a comment
3. Watch the counts update!

---

## 🗄️ Verify MySQL Database

### **Check Tables Created**

Open Command Prompt and run:
```bash
mysql -u root -p
```
Enter password: `root`

Then run:
```sql
USE crewcanvas_db;
SHOW TABLES;
```

You should see:
```
+---------------------------+
| Tables_in_crewcanvas_db   |
+---------------------------+
| connections               |
| events                    |
| messages                  |
| posts                     |
| projects                  |
| users                     |
+---------------------------+
```

### **View Your User Data**

```sql
SELECT * FROM users;
```

You should see your registered user!

---

## � What You Can Do Now

### **✅ Working Features**

1. **User Registration** - Create new accounts
2. **User Login** - Authenticate users
3. **Dashboard** - View stats and activity
4. **Social Feed** - Create, view, like, comment on posts
5. **Follow Users** - Follow suggested connections
6. **Upload Images** - Add images to posts
7. **View Profiles** - See user information

### **📊 Available Pages**

- ✅ **Login/Signup** - http://localhost:8080/index.html
- ✅ **Dashboard** - http://localhost:8080/home.html
- ✅ **Feed** - http://localhost:8080/feed.html

---

## 🔧 Troubleshooting

### **Problem: Application won't start**

**Solution:**
1. Check MySQL is running: `sc query MySQL80`
2. Check port 8080 is not in use
3. Check console for error messages
4. Verify Java 17 is installed: `java -version`

---

### **Problem: "Access denied for user 'root'"**

**Solution:**
Update `application.properties`:
```properties
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password
```

---

### **Problem: "Table doesn't exist"**

**Solution:**
1. Check `spring.jpa.hibernate.ddl-auto=update` in application.properties
2. Restart the application
3. Tables should be created automatically

---

### **Problem: Maven dependencies not downloading**

**Solution:**
1. Right-click project → Maven → Update Project
2. Check internet connection
3. Try: Clean project → Maven → Update Project

---

### **Problem: Login page shows but can't login**

**Solution:**
1. Check console for errors
2. Verify MySQL connection
3. Check if user was created: `SELECT * FROM users;`

---

## � API Testing with Postman

### **Create a Post**
```
POST http://localhost:8080/api/posts
Headers: Content-Type: application/json
Body:
{
  "userId": 1,
  "content": "My first post!",
  "imageUrl": ""
}
```

### **Get All Posts**
```
GET http://localhost:8080/api/posts
```

### **Follow a User**
```
POST http://localhost:8080/api/profile/2/follow?followerId=1
```

### **Create an Event**
```
POST http://localhost:8080/api/events
Headers: Content-Type: application/json
Body:
{
  "userId": 1,
  "title": "Film Audition",
  "eventType": "Audition",
  "location": "Mumbai",
  "date": "2026-03-15",
  "description": "Looking for lead actor"
}
```

---

## � Success Checklist

- [ ] MySQL is running
- [ ] Project imported into Eclipse
- [ ] Maven dependencies downloaded
- [ ] Application starts without errors
- [ ] Can access http://localhost:8080
- [ ] Can create an account
- [ ] Can login
- [ ] Can view dashboard
- [ ] Can create posts
- [ ] Can like and comment
- [ ] Database tables created
- [ ] User data saved in MySQL

---

## 📚 Next Steps

Once everything is working:

1. **Explore the API** - Test all 41 endpoints
2. **Create More Users** - Test follow/unfollow
3. **Create Events** - Use the Events API
4. **Add Projects** - Build your portfolio
5. **Send Messages** - Test messaging API

---

## 💡 Tips

- **Auto-refresh feed:** Reload the page to see new posts
- **Check console:** Watch for SQL queries and errors
- **Use Chrome DevTools:** Press F12 to see network requests
- **Test APIs:** Use Postman for backend testing

---

## 🚀 You're Ready!

Your CrewCanvas application is now running with:
- ✅ MySQL database
- ✅ 41 REST API endpoints
- ✅ Working login and signup
- ✅ Social feed functionality
- ✅ Dashboard with stats
- ✅ Orange gradient theme

**Start creating posts and connecting with film professionals!** 🎬

