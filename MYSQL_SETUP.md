# MySQL Database Setup for CrewCanvas

## 📋 Prerequisites

You need MySQL installed on your system.

---

## 🔧 Step 1: Install MySQL

### Option A: Download MySQL Installer (Recommended)
1. Visit: https://dev.mysql.com/downloads/installer/
2. Download "MySQL Installer for Windows"
3. Run the installer
4. Choose "Developer Default" or "Server only"
5. Set root password to: **root** (or update application.properties)
6. Complete the installation

### Option B: Using Chocolatey
```bash
choco install mysql -y
```

---

## 🗄️ Step 2: Create Database

The application will automatically create the database `crewcanvas_db` when it starts, thanks to this configuration:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/crewcanvas_db?createDatabaseIfNotExist=true
```

But if you want to create it manually:

### Using MySQL Command Line:
```sql
mysql -u root -p
# Enter password: root

CREATE DATABASE crewcanvas_db;
USE crewcanvas_db;
SHOW TABLES;
EXIT;
```

### Using MySQL Workbench:
1. Open MySQL Workbench
2. Connect to localhost
3. Click "Create new schema" button
4. Name: `crewcanvas_db`
5. Click "Apply"

---

## ⚙️ Step 3: Verify MySQL Configuration

### Check MySQL is Running:

**Windows:**
```bash
# Check MySQL service status
sc query MySQL80

# Start MySQL if not running
net start MySQL80
```

**Or use Services:**
1. Press `Win + R`
2. Type `services.msc`
3. Find "MySQL80" service
4. Ensure it's "Running"

---

## 🔑 Step 4: Update Database Credentials (If Needed)

If your MySQL username/password is different, update `application.properties`:

```properties
spring.datasource.username=your_username
spring.datasource.password=your_password
```

Current configuration:
- **Username:** root
- **Password:** root
- **Database:** crewcanvas_db
- **Port:** 3306

---

## 📊 Step 5: Verify Database Connection

After starting the application, check if the `users` table was created:

```sql
mysql -u root -p
USE crewcanvas_db;
SHOW TABLES;
DESCRIBE users;
```

You should see:
```
+------------+--------------+------+-----+---------+----------------+
| Field      | Type         | Null | Key | Default | Extra          |
+------------+--------------+------+-----+---------+----------------+
| id         | bigint       | NO   | PRI | NULL    | auto_increment |
| name       | varchar(255) | NO   |     | NULL    |                |
| email      | varchar(255) | NO   | UNI | NULL    |                |
| password   | varchar(255) | NO   |     | NULL    |                |
| created_at | datetime(6)  | YES  |     | NULL    |                |
+------------+--------------+------+-----+---------+----------------+
```

---

## 🧪 Test Database Operations

### 1. Start the Application
```bash
# In Eclipse: Run as Java Application
# Or use command line:
mvn spring-boot:run
```

### 2. Test Signup
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"John Doe\",\"email\":\"john@test.com\",\"password\":\"test123\"}"
```

### 3. Check Database
```sql
SELECT * FROM users;
```

### 4. Test Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"john@test.com\",\"password\":\"test123\"}"
```

---

## 🔧 Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"
**Solution:** Update password in `application.properties`

### Error: "Communications link failure"
**Solution:** 
1. Check MySQL is running: `net start MySQL80`
2. Verify port 3306 is correct
3. Check firewall settings

### Error: "Unknown database 'crewcanvas_db'"
**Solution:** The database should be created automatically. If not:
```sql
CREATE DATABASE crewcanvas_db;
```

### Error: "Table 'users' doesn't exist"
**Solution:** 
1. Check `spring.jpa.hibernate.ddl-auto=update` in application.properties
2. Restart the application
3. Check console logs for errors

---

## 📝 MySQL Workbench (Optional)

For easier database management:

1. Download MySQL Workbench: https://dev.mysql.com/downloads/workbench/
2. Connect to localhost:3306
3. Username: root, Password: root
4. You can view/edit data visually

---

## ✅ Verification Checklist

- [ ] MySQL installed and running
- [ ] Database `crewcanvas_db` exists (or will be auto-created)
- [ ] Username and password match application.properties
- [ ] Port 3306 is accessible
- [ ] Application starts without database errors
- [ ] Can signup new users
- [ ] Can login with created users
- [ ] Data persists in MySQL (not lost on restart)

---

**Your MySQL database is now configured for CrewCanvas!**
