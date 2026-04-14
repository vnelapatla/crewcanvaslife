import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class AlterTable {
    public static void main(String[] args) {
        String[] urls = {
            "jdbc:mysql://localhost:3306/crewcanvas_user_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC",
            "jdbc:mysql://localhost:3306/crewcanvas_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
        };
        String user = "root";
        String password = "root";

        for (String url : urls) {
            try {
                System.out.println("Processing " + url);
                Connection conn = DriverManager.getConnection(url, user, password);
                Statement stmt = conn.createStatement();
                try { stmt.executeUpdate("ALTER TABLE users MODIFY COLUMN profile_picture LONGTEXT"); System.out.println("profile_picture altered"); } catch(Exception e) { System.out.println("Error 1: " + e.getMessage()); }
                try { stmt.executeUpdate("ALTER TABLE users MODIFY COLUMN cover_image LONGTEXT"); System.out.println("cover_image altered"); } catch(Exception e) { System.out.println("Error 2: " + e.getMessage()); }
                conn.close();
            } catch (Exception e) {
                System.out.println("Database " + url + " error: " + e.getMessage());
            }
        }
    }
}
