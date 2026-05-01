package com.crewcanvas.controller;

import com.crewcanvas.model.Post;
import com.crewcanvas.model.Poll;
import com.crewcanvas.model.PollOption;
import com.crewcanvas.model.User;
import com.crewcanvas.repository.PostRepository;
import com.crewcanvas.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/debug")
public class DataSeedingController {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @org.springframework.web.bind.annotation.GetMapping("/seed-posts")
    public ResponseEntity<String> seedPosts() {
        // 1. Get or Create a test user
        User testUser = userRepository.findByEmail("testuser@example.com").orElseGet(() -> {
            User u = new User("Venkatesh Goud", "testuser@example.com", "password123");
            u.setRole("Actor");
            u.setBio("Passionate actor looking for roles.");
            u.setUserType("Professional");
            return userRepository.save(u);
        });

        User otherUser = userRepository.findByEmail("director@example.com").orElseGet(() -> {
            User u = new User("John Director", "director@example.com", "password123");
            u.setRole("Director");
            u.setBio("Independent film maker.");
            u.setUserType("Professional");
            return userRepository.save(u);
        });

        String[] keywords = {"Acting", "Directing", "Casting", "Crew", "Movie", "Film", "Audition", "Script", "Production", "Camera"};
        String[] locations = {"Mumbai", "Hyderabad", "Bangalore", "Chennai", "Delhi"};
        Random random = new Random();

        List<Post> postsToSave = new ArrayList<>();

        for (int i = 1; i <= 40; i++) {
            Post post = new Post();
            User author = (i % 5 == 0) ? testUser : otherUser;
            post.setUserId(author.getId());
            post.setCreatedAt(java.time.Instant.now().minus(random.nextInt(30), java.time.temporal.ChronoUnit.DAYS).minus(random.nextInt(24), java.time.temporal.ChronoUnit.HOURS));
            
            String keyword = keywords[random.nextInt(keywords.length)];
            String location = locations[random.nextInt(locations.length)];
            
            if (i % 10 == 0) {
                // Poll Post
                post.setContent("Looking for " + keyword + " feedback in " + location + ". What do you think?");
                Poll poll = new Poll("Which " + keyword + " style do you prefer?");
                poll.addOption(new PollOption("Modern"));
                poll.addOption(new PollOption("Classic"));
                poll.addOption(new PollOption("Indie"));
                poll.setPost(post);
                post.setPoll(poll);
            } else if (i % 3 == 0) {
                // Image Post
                post.setContent("New " + keyword + " update from " + location + "! Check out the set.");
                post.setImageUrls(Arrays.asList("https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800"));
            } else if (i % 7 == 0) {
                // Video Post
                post.setContent("Behind the scenes of our new " + keyword + " project in " + location + ".");
                // We use a dummy video URL format that our frontend detects
                post.setImageUrls(Arrays.asList("data:video/mp4;base64,video_placeholder_url_" + i));
            } else {
                // Text Post
                post.setContent("Just finished a great " + keyword + " session in " + location + ". Highly recommend the crew!");
            }

            post.setLikes(random.nextInt(100));
            post.setComments(random.nextInt(20));
            postsToSave.add(post);
        }

        postRepository.saveAll(postsToSave);

        return ResponseEntity.ok("Successfully seeded 40 diverse posts for user " + testUser.getName() + " and others.");
    }
}
