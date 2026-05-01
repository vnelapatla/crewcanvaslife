import java.time.Instant;
import java.time.format.DateTimeFormatter;

public class TestInstant {
    public static void main(String[] args) {
        try {
            Instant now = Instant.now();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            System.out.println(now.format(formatter)); 
            
            // This should fail at runtime if Instant doesn't support the fields
            System.out.println(formatter.format(now));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
