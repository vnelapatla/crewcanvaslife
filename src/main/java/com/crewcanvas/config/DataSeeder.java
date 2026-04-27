package com.crewcanvas.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Random;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner seedAdminData(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                // 1. Find Admin User ID
                Long adminId = null;
                try {
                    adminId = jdbcTemplate.queryForObject(
                        "SELECT id FROM users WHERE email LIKE 'crewcanvas2@gmail.com%' LIMIT 1", 
                        Long.class
                    );
                } catch (Exception e) {
                    System.out.println("Admin account not found. Skipping data seeding.");
                    return;
                }

                // 1.5 Update Admin Profile to be a professional Actor
                jdbcTemplate.update(
                    "UPDATE users SET " +
                    "role = 'Actor', " +
                    "experience = '8+ Years (Pro)', " +
                    "bio = 'Professional Actor with a decade of experience in method acting and physical theater. Specialized in high-intensity action sequences and complex dramatic roles. Featured in over 20 independent and commercial projects.', " +
                    "height = '182', " +
                    "weight = '75', " +
                    "age_range = '25-30', " +
                    "gender = 'Male', " +
                    "body_type = 'Athletic', " +
                    "languages = 'English, Hindi, Marathi, Spanish', " +
                    "location = 'Mumbai, India', " +
                    "skills = 'Method Acting, Martial Arts, Horse Riding, Screenwriting, Sword Fighting', " +
                    "instagram = '@crewcanvas_official', " +
                    "youtube = 'https://youtube.com/crewcanvas', " +
                    "expected_movie_remuneration = '$15,000+', " +
                    "expected_webseries_remuneration = '$8,000+', " +
                    "is_verified_professional = TRUE, " +
                    "user_type = 'Aspirant', " +
                    "profile_score = 100 " +
                    "WHERE id = ?",
                    adminId
                );

                // Check if already seeded (prevent duplicates every restart)
                Integer postCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM posts WHERE user_id = ?", 
                    Integer.class, 
                    adminId
                );
                
                if (postCount >= 20) {
                    System.out.println("Admin data already seeded. Skipping posts/projects.");
                    return;
                }

                System.out.println("Seeding 20 posts and 20 projects for Admin (ID: " + adminId + ")...");

                String[] movieTitles = {
                    "The Silent Director", "Neon Nights", "Shadow of the Canvas", "Eternal Echo", 
                    "Vector Strike", "The Last Frame", "Cinematic Souls", "Midnight Reel", 
                    "Parallel Paths", "The Scriptwriter", "Visual Symphony", "Behind the Lens",
                    "The Producer's Gamble", "Framerate", "Analog Dreams", "Digital Horizon",
                    "The Colorist", "Soundstage 9", "Indie Spirit", "Blockbuster Bound"
                };

                String[] genres = {"Thriller", "Sci-Fi", "Drama", "Action", "Documentary", "Horror"};
                String[] roles = {"Director", "Producer", "Editor", "Cinematographer", "Writer"};

                String[] movieImages = {
                    "https://images.unsplash.com/photo-1485846234645-a62644ef7467?q=80&w=400",
                    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400",
                    "https://images.unsplash.com/photo-1542204172-3f16994491c1?q=80&w=400",
                    "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=400",
                    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=400",
                    "https://images.unsplash.com/photo-1440404653322-3efe53daa38a?q=80&w=400",
                    "https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?q=80&w=400",
                    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400",
                    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=400",
                    "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?q=80&w=400",
                    "https://images.unsplash.com/photo-1514306191717-452ec28c7814?q=80&w=400",
                    "https://images.unsplash.com/photo-1494194127053-1dd77e239270?q=80&w=400",
                    "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=400",
                    "https://images.unsplash.com/photo-1535016120720-40c646bebbdc?q=80&w=400",
                    "https://images.unsplash.com/photo-1496337589254-7e19d01cedf8?q=80&w=400",
                    "https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?q=80&w=400",
                    "https://images.unsplash.com/photo-1495567720989-cebdbdd97913?q=80&w=400",
                    "https://images.unsplash.com/photo-1515634928627-2a4e0dae3ddf?q=80&w=400",
                    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400",
                    "https://images.unsplash.com/photo-1470219556762-1771e7f9427d?q=80&w=400"
                };

                Random rand = new Random();

                // 2. Add 20 Projects
                for (int i = 0; i < 20; i++) {
                    jdbcTemplate.update(
                        "INSERT INTO projects (user_id, title, description, genre, role, release_year, verified, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                        adminId,
                        movieTitles[i],
                        "A professional " + genres[rand.nextInt(genres.length)] + " project produced by CrewCanvas official team.",
                        genres[rand.nextInt(genres.length)],
                        roles[rand.nextInt(roles.length)],
                        2020 + rand.nextInt(7),
                        true,
                        movieImages[i]
                    );
                }

                // 3. Add 20 Posts
                String[] postContent = {
                    "Excited to announce our new production collaboration!",
                    "Behind the scenes of our latest shoot. The lighting was perfect today.",
                    "Check out our new movie project on the profile. Feedbacks are welcome!",
                    "Who wants to join our next indie project? Looking for editors.",
                    "Just finished color grading for 'Neon Nights'. What a journey!",
                    "Technology in cinema is evolving so fast. Are you keeping up with AI tools?",
                    "A great day at the studio with some amazing talent.",
                    "Our official movie reel for 2026 is almost ready. Stay tuned!",
                    "Tips for young directors: Focus on the story, not just the gear.",
                    "The sound design for our latest project is mind-blowing. Kudos to the team.",
                    "Official Update: CrewCanvas is expanding its reach globally.",
                    "Just uploaded a poll. Go vote for the next project theme!",
                    "Collaboration is the key to success in the film industry.",
                    "Throwback to our first ever project. How far we've come!",
                    "Late night editing sessions... the coffee is running low but the passion is high.",
                    "Cinematography is the art of painting with light.",
                    "Looking for a scriptwriter for a new psychological thriller.",
                    "Our community is growing! 5000+ creatives now on CrewCanvas.",
                    "The power of visual storytelling can change the world.",
                    "Final render in progress. The wait is always the hardest part."
                };

                for (int i = 0; i < 20; i++) {
                    jdbcTemplate.update(
                        "INSERT INTO posts (user_id, content, likes, comments, created_at, image_url) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)",
                        adminId,
                        postContent[i],
                        rand.nextInt(100),
                        rand.nextInt(15),
                        movieImages[(i + 10) % 20] // Use a different set of images for posts
                    );

                    // Get the last inserted post ID to add to post_images table for multi-image support
                    Long postId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
                    jdbcTemplate.update(
                        "INSERT INTO post_images (post_id, image_url) VALUES (?, ?)",
                        postId,
                        movieImages[(i + 10) % 20]
                    );
                }

                System.out.println("SUCCESS: 20 posts and 20 projects added for Admin.");

            } catch (Exception e) {
                System.err.println("Seeding error: " + e.getMessage());
            }
        };
    }
}
