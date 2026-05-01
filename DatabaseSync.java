import java.sql.*;
import java.util.*;

public class DatabaseSync {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/crewcanvas_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
        String user = "root";
        String password = "root";

        String[] queries = {
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(191) UNIQUE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified_professional BOOLEAN DEFAULT FALSE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_score INT DEFAULT 0",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_sent BOOLEAN DEFAULT FALSE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS experience TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS availability TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS availability_from DATE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS availability_to DATE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS expected_movie_remuneration TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS expected_webseries_remuneration TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS genres TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS projects_directed TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS budget_handled TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS vision_statement TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS editing_software TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_videos TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS camera_expertise TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS sample_tracks TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS height TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS weight TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS age_range TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS body_type TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS languages TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS team_size TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS showreel TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS editing_style TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_details TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS turnaround_time TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS daws TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS instruments TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS music_experience TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS youtube TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS goals TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS learning_resources TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS followers INT DEFAULT 0",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS following INT DEFAULT 0",
            "ALTER TABLE users MODIFY COLUMN profile_picture LONGTEXT",
            "ALTER TABLE users MODIFY COLUMN cover_image LONGTEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS recent_pictures LONGTEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS resume LONGBLOB",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_file_name VARCHAR(255)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_content_type VARCHAR(100)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(50) DEFAULT 'Everyone'",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS message_permissions VARCHAR(50) DEFAULT 'Everyone'",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS follower_notifications BOOLEAN DEFAULT TRUE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS event_reminders BOOLEAN DEFAULT TRUE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at DATETIME",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at DATETIME",
            "ALTER TABLE users MODIFY COLUMN bio TEXT",
            "ALTER TABLE users MODIFY COLUMN skills TEXT",
            "ALTER TABLE users MODIFY COLUMN experience TEXT",
            "ALTER TABLE users MODIFY COLUMN location TEXT"
        };

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            System.out.println("Connecting to database...");
            Connection conn = DriverManager.getConnection(url, user, password);
            Statement stmt = conn.createStatement();

            for (String query : queries) {
                try {
                    stmt.executeUpdate(query);
                    System.out.println("Executed: " + query);
                } catch (SQLException e) {
                    // Ignore if column already exists or other non-critical errors
                    System.out.println("Skipped/Failed: " + query + " (Error: " + e.getMessage() + ")");
                }
            }

            System.out.println("\nDatabase Sync Complete!");
            conn.close();
        } catch (Exception e) {
            System.err.println("Critical Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
