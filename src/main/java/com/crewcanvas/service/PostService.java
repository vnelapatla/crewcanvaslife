package com.crewcanvas.service;

import com.crewcanvas.model.Comment;
import com.crewcanvas.model.Post;
import com.crewcanvas.repository.CommentRepository;
import com.crewcanvas.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@org.springframework.transaction.annotation.Transactional
public class PostService {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private com.crewcanvas.repository.PollRepository pollRepository;

    @Autowired
    private com.crewcanvas.repository.PollVoteRepository pollVoteRepository;

    @Autowired
    private com.crewcanvas.repository.UserRepository userRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    public Post createPost(Long userId, String content, List<String> imageUrls, List<String> externalLinks, String aspectRatio) {
        // CC-S1-103: Media Processing [Nelpatla Venkatesh] - Implement multi-image upload support and video processing logic.
        // Restriction: Only admin (crewcanvas2@gmail.com) can post videos
        com.crewcanvas.model.User user = userRepository.findById(userId).orElse(null);
        boolean isAdmin = user != null && (Boolean.TRUE.equals(user.getIsAdmin()) || "crewcanvas2@gmail.com".equalsIgnoreCase(user.getEmail()));
        
        boolean hasVideo = imageUrls != null && imageUrls.stream().anyMatch(url -> url != null && url.startsWith("data:video/"));
        
        if (hasVideo && !isAdmin) {
            throw new RuntimeException("Video uploads in posts are restricted to administrators.");
        }

        Post post = new Post(userId, content, imageUrls, externalLinks);
        if (aspectRatio != null) post.setAspectRatio(aspectRatio);
        Post savedPost = postRepository.save(post);
        
        // Broadcast notification if Admin
        if (isAdmin) {
            notificationService.broadcastAdminPostNotification(savedPost, user);
        }

        return populatePollData(savedPost);
    }

    public Post createPoll(Long userId, String question, List<String> options) {
        // CC-S1-104: Polling System [Nelpatla Venkatesh] - Develop the full lifecycle for post-based polls including vote tracking.
        Post post = new Post(userId, question);
        com.crewcanvas.model.Poll poll = new com.crewcanvas.model.Poll(question);
        
        for (String optText : options) {
            poll.addOption(new com.crewcanvas.model.PollOption(optText));
        }
        
        post.setPoll(poll);
        Post savedPost = postRepository.save(post);

        // Broadcast notification if Admin
        com.crewcanvas.model.User user = userRepository.findById(userId).orElse(null);
        if (user != null && (Boolean.TRUE.equals(user.getIsAdmin()) || "crewcanvas2@gmail.com".equalsIgnoreCase(user.getEmail()))) {
            notificationService.broadcastAdminPostNotification(savedPost, user);
        }

        return populatePollData(savedPost);
    }

    public org.springframework.data.domain.Page<Post> getAllPosts(int page, int size) {
        org.springframework.data.domain.Page<Post> posts = postRepository.findAllByOrderByCreatedAtDesc(org.springframework.data.domain.PageRequest.of(page, size));
        populateExtraData(posts.getContent());
        return posts;
    }

    public List<Post> getAllPosts() {
        List<Post> posts = postRepository.findAllByOrderByCreatedAtDesc();
        populateExtraData(posts);
        return posts;
    }

    public org.springframework.data.domain.Page<Post> searchPosts(String keyword, String timeFrame, int page, int size) {
        return searchAdvanced(keyword, timeFrame, null, "latest", page, size);
    }

    public org.springframework.data.domain.Page<Post> searchAdvanced(String keyword, String timeFrame, String contentType, String sortBy, int page, int size) {
        java.time.LocalDateTime sinceDate = null;
        if (timeFrame != null) {
            switch (timeFrame.toLowerCase()) {
                case "day":
                    sinceDate = java.time.LocalDateTime.now().minusDays(1);
                    break;
                case "week":
                    sinceDate = java.time.LocalDateTime.now().minusWeeks(1);
                    break;
                case "month":
                    sinceDate = java.time.LocalDateTime.now().minusMonths(1);
                    break;
            }
        }

        if (sortBy == null || sortBy.isEmpty()) sortBy = "latest";
        if (contentType != null && (contentType.isEmpty() || contentType.equals("all"))) contentType = null;

        // CC-MAY-004: Fix Hibernate 6 Query Validation [T Dheeraj] - Pre-format keyword pattern
        String keywordPattern = (keyword == null || keyword.isEmpty()) ? "%" : "%" + keyword.toLowerCase() + "%";

        org.springframework.data.domain.Page<Post> posts = postRepository.searchAdvanced(
            keywordPattern, sinceDate, contentType, sortBy, org.springframework.data.domain.PageRequest.of(page, size));
        
        populateExtraData(posts.getContent());
        return posts;
    }

    public org.springframework.data.domain.Page<Post> getUserPosts(Long userId, int page, int size) {
        org.springframework.data.domain.Page<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(userId, org.springframework.data.domain.PageRequest.of(page, size));
        populateExtraData(posts.getContent());
        return posts;
    }

    public List<Post> getUserPosts(Long userId) {
        List<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(userId);
        populateExtraData(posts);
        return posts;
    }

    public Optional<Post> getPostById(Long id) {
        return postRepository.findById(id).map(this::populatePollData);
    }

    public Post updatePost(Long id, String content, List<String> imageUrls, List<String> externalLinks, String aspectRatio) {
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isPresent()) {
            Post post = postOpt.get();

            // Restriction: Only admin (crewcanvas2@gmail.com) can post videos
            com.crewcanvas.model.User user = userRepository.findById(post.getUserId()).orElse(null);
            boolean isAdmin = user != null && (Boolean.TRUE.equals(user.getIsAdmin()) || "crewcanvas2@gmail.com".equalsIgnoreCase(user.getEmail()));
            
            boolean hasVideo = imageUrls != null && imageUrls.stream().anyMatch(url -> url != null && url.startsWith("data:video/"));
            
            if (hasVideo && !isAdmin) {
                throw new RuntimeException("Video uploads in posts are restricted to administrators.");
            }

            if (content != null)
                post.setContent(content);
            if (imageUrls != null)
                post.setImageUrls(imageUrls);
            if (externalLinks != null)
                post.setExternalLinks(externalLinks);
            if (aspectRatio != null)
                post.setAspectRatio(aspectRatio);
            return postRepository.save(post);
        }
        throw new RuntimeException("Post not found");
    }

    public void deletePost(Long id, Long userId) {
        // CC-S1-101: Secure Post Deletion [Nelpatla Venkatesh] - Added ownership validation
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isPresent()) {
            if (postOpt.get().getUserId().equals(userId)) {
                postRepository.deleteById(id);
            } else {
                throw new RuntimeException("Unauthorized: You do not own this post.");
            }
        } else {
            throw new RuntimeException("Post not found");
        }
    }

    public Post likePost(Long id, Long userId) {
        // CC-S1-102: Social Interactions [Nelpatla Venkatesh] - Refine backend logic for Like/Comment/Share interactions.
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            if (post.getLikedByUsers().contains(userId)) {
                post.getLikedByUsers().remove(userId);
                post.setLikes(post.getLikes() - 1);
            } else {
                post.getLikedByUsers().add(userId);
                post.setLikes(post.getLikes() + 1);
                
                // Trigger Notification
                if (!post.getUserId().equals(userId)) {
                    final int currentLikes = post.getLikes();
                    userRepository.findById(post.getUserId()).ifPresent(postOwner -> {
                        boolean isAdmin = Boolean.TRUE.equals(postOwner.getIsAdmin()) || "crewcanvas2@gmail.com".equalsIgnoreCase(postOwner.getEmail());
                        
                        // If admin, only notify on multiples of 5 (5, 10, 15...)
                        boolean shouldNotify = !isAdmin || (currentLikes > 0 && currentLikes % 5 == 0);
                        
                        if (shouldNotify) {
                            notificationService.createNotification(
                                post.getUserId(),
                                userId,
                                "LIKE",
                                isAdmin ? "Your post reached " + currentLikes + " likes!" : "liked your post.",
                                post.getId().toString()
                            );
        
                            // Send Email Notification
                            try {
                                userRepository.findById(userId).ifPresent(liker -> {
                                    emailService.sendLikeNotificationEmail(postOwner.getEmail(), liker.getName(), post.getId());
                                });
                            } catch (Exception e) {
                                System.err.println("Failed to send like email notification: " + e.getMessage());
                            }
                        }
                    });
                }
            }
            return postRepository.save(post);
        }
        throw new RuntimeException("Post not found");
    }

    public Post repostPost(Long originalPostId, Long userId, String repostContent) {
        Optional<Post> originalOpt = postRepository.findById(originalPostId);
        if (originalOpt.isPresent()) {
            Post original = originalOpt.get();
            
            // Increment repost count on original
            original.setRepostsCount(original.getRepostsCount() + 1);
            original.getRepostedByUsers().add(userId);
            postRepository.save(original);
            
            // Create new post as a repost
            Post repost = new Post(userId, repostContent);
            repost.setOriginalPostId(originalPostId);
            
            Post savedRepost = postRepository.save(repost);
            
            // Notify original author
            if (!original.getUserId().equals(userId)) {
                notificationService.createNotification(
                    original.getUserId(),
                    userId,
                    "REPOST",
                    "reposted your post.",
                    savedRepost.getId().toString()
                );
            }
            
            return populatePollData(savedRepost);
        }
        throw new RuntimeException("Original post not found");
    }

    public Comment addComment(Long id, Long userId, String text, Long parentId) {
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            post.setComments(post.getComments() + 1);
            postRepository.save(post);

            Comment comment = new Comment(id, userId, text, parentId);
            Comment savedComment = commentRepository.save(comment);

            // Trigger Notification
            if (userId != null && !post.getUserId().equals(userId)) {
                notificationService.createNotification(
                    post.getUserId(),
                    userId,
                    "COMMENT",
                    "commented on your post: " + (text.length() > 30 ? text.substring(0, 30) + "..." : text),
                    post.getId().toString()
                );
            }
            
            // Populate user details for the new comment
            populateCommentUserDetails(savedComment);
            return savedComment;
        }
        throw new RuntimeException("Post not found");
    }

    public Comment likeComment(Long commentId, Long userId) {
        Optional<Comment> commentOpt = commentRepository.findById(commentId);
        if (commentOpt.isPresent()) {
            Comment comment = commentOpt.get();
            if (comment.getLikedByUsers().contains(userId)) {
                comment.getLikedByUsers().remove(userId);
                comment.setLikesCount(Math.max(0, comment.getLikesCount() - 1));
            } else {
                comment.getLikedByUsers().add(userId);
                comment.setLikesCount(comment.getLikesCount() + 1);
            }
            return commentRepository.save(comment);
        }
        throw new RuntimeException("Comment not found");
    }

    private void populateCommentUserDetails(Comment comment) {
        userRepository.findById(comment.getUserId()).ifPresent(user -> {
            java.util.Map<String, Object> details = new java.util.HashMap<>();
            details.put("id", user.getId());
            details.put("name", user.getName());
            details.put("profilePicture", user.getProfilePicture());
            details.put("role", user.getRole());
            comment.setUserDetails(details);
        });
    }

    public void deleteComment(Long commentId, Long userId) {
        Optional<Comment> commentOpt = commentRepository.findById(commentId);
        if (commentOpt.isPresent()) {
            Comment comment = commentOpt.get();
            if (comment.getUserId().equals(userId)) {
                // Update post count
                Optional<Post> postOpt = postRepository.findById(comment.getPostId());
                if (postOpt.isPresent()) {
                    Post post = postOpt.get();
                    post.setComments(Math.max(0, post.getComments() - 1));
                    postRepository.save(post);
                }
                
                // If it's a parent, delete replies too
                if (comment.getParentId() == null) {
                    List<Comment> replies = commentRepository.findByParentIdOrderByCreatedAtAsc(commentId);
                    commentRepository.deleteAll(replies);
                }
                
                commentRepository.delete(comment);
            } else {
                throw new RuntimeException("Unauthorized");
            }
        }
    }

    public List<Comment> getCommentsForPost(Long postId) {
        // Fetch ALL comments for this post at once to build a tree efficiently
        List<Comment> allComments = commentRepository.findByPostIdOrderByCreatedAtDesc(postId);
        
        // 1. Batch fetch all unique user IDs to populate details
        java.util.Set<Long> userIds = allComments.stream()
                .map(Comment::getUserId)
                .collect(java.util.stream.Collectors.toSet());
        
        java.util.Map<Long, com.crewcanvas.model.User> userMap = userRepository.findAllById(userIds).stream()
                .collect(java.util.stream.Collectors.toMap(com.crewcanvas.model.User::getId, u -> u));

        // 2. Build map and populate user details
        java.util.Map<Long, Comment> commentMap = new java.util.HashMap<>();
        for (Comment c : allComments) {
            assignUserDetailsToComment(c, userMap);
            commentMap.put(c.getId(), c);
        }

        // 3. Construct tree
        List<Comment> rootComments = new java.util.ArrayList<>();
        for (Comment c : allComments) {
            if (c.getParentId() == null) {
                rootComments.add(c);
            } else {
                Comment parent = commentMap.get(c.getParentId());
                if (parent != null) {
                    if (parent.getReplies() == null) {
                        parent.setReplies(new java.util.ArrayList<>());
                    }
                    parent.getReplies().add(c);
                } else {
                    // Fallback: if parent not found, treat as root or skip
                    rootComments.add(c);
                }
            }
        }

        // 4. Sort replies by date (ascending) for natural conversation flow
        sortRepliesRecursive(rootComments);

        return rootComments;
    }

    private void sortRepliesRecursive(List<Comment> comments) {
        if (comments == null) return;
        for (Comment c : comments) {
            if (c.getReplies() != null) {
                c.getReplies().sort(java.util.Comparator.comparing(Comment::getCreatedAt));
                sortRepliesRecursive(c.getReplies());
            }
        }
    }

    private void assignUserDetailsToComment(Comment comment, java.util.Map<Long, com.crewcanvas.model.User> userMap) {
        com.crewcanvas.model.User user = userMap.get(comment.getUserId());
        if (user != null) {
            java.util.Map<String, Object> details = new java.util.HashMap<>();
            details.put("id", user.getId());
            details.put("name", user.getName());
            details.put("profilePicture", user.getProfilePicture());
            details.put("role", user.getRole());
            comment.setUserDetails(details);
        }
    }

    public Post votePoll(Long postId, Long userId, Integer optionIndex) {
        Optional<Post> postOpt = postRepository.findById(postId);
        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            com.crewcanvas.model.Poll poll = post.getPoll();
            if (poll != null) {
                // Find option by index
                if (optionIndex < 0 || optionIndex >= poll.getOptions().size()) {
                    throw new RuntimeException("Invalid option index");
                }
                Long optionId = poll.getOptions().get(optionIndex).getId();
                
                // Check if already voted
                Optional<com.crewcanvas.model.PollVote> existingVote = pollVoteRepository.findByPollIdAndUserId(poll.getId(), userId);
                if (existingVote.isPresent()) {
                    existingVote.get().setOptionId(optionId);
                    pollVoteRepository.save(existingVote.get());
                } else {
                    pollVoteRepository.save(new com.crewcanvas.model.PollVote(poll.getId(), userId, optionId));
                }
                return populatePollData(post); 
            }
            throw new RuntimeException("Post is not a poll");
        }
        throw new RuntimeException("Post not found");
    }

    private void populateExtraData(List<Post> posts) {
        if (posts.isEmpty()) return;

        // 1. Batch fetch all unique user IDs
        java.util.List<Long> userIds = posts.stream()
                .map(Post::getUserId)
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        java.util.Map<Long, com.crewcanvas.model.User> userMap = userRepository.findAllById(userIds).stream()
                .collect(java.util.stream.Collectors.toMap(com.crewcanvas.model.User::getId, u -> u));

        // 2. Populate data for each post
        posts.forEach(post -> {
            // User Details
            com.crewcanvas.model.User user = userMap.get(post.getUserId());
            if (user != null) {
                java.util.Map<String, Object> details = new java.util.HashMap<>();
                details.put("id", user.getId());
                details.put("name", user.getName());
                details.put("role", user.getRole());
                details.put("profilePicture", user.getProfilePicture());
                post.setUserDetails(details);
            }

            // Poll Data (Eagerly fetched by Poll relationship, but needs Map conversion)
            if (post.getPoll() != null) {
                com.crewcanvas.model.Poll poll = post.getPoll();
                java.util.List<com.crewcanvas.model.PollVote> votes = pollVoteRepository.findByPollId(poll.getId());
                java.util.Map<Long, Integer> voteMap = new java.util.HashMap<>();

                java.util.Map<Long, Integer> optionIdToIndex = new java.util.HashMap<>();
                for (int i = 0; i < poll.getOptions().size(); i++) {
                    optionIdToIndex.put(poll.getOptions().get(i).getId(), i);
                }

                for (com.crewcanvas.model.PollVote vote : votes) {
                    Integer index = optionIdToIndex.get(vote.getOptionId());
                    if (index != null) {
                        voteMap.put(vote.getUserId(), index);
                    }
                }
                poll.setPollVotes(voteMap);

                java.util.List<String> optStrings = poll.getOptions().stream()
                        .map(com.crewcanvas.model.PollOption::getOptionText)
                        .collect(java.util.stream.Collectors.toList());
                post.setPollOptions(optStrings);
                post.setPollQuestion(poll.getQuestion());
            }
        });

        // 3. Batch fetch original posts if any
        java.util.List<Long> originalIds = posts.stream()
                .map(Post::getOriginalPostId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(java.util.stream.Collectors.toList());
        
        if (!originalIds.isEmpty()) {
            java.util.List<Post> originalPosts = postRepository.findAllById(originalIds);
            
            // To avoid infinite recursion, we only populate user details and polls for the original posts
            // without trying to load their original posts (LinkedIn only shows one level of repost usually)
            
            // Batch fetch users for original posts
            java.util.List<Long> originalUserIds = originalPosts.stream()
                    .map(Post::getUserId)
                    .distinct()
                    .collect(java.util.stream.Collectors.toList());
            
            java.util.Map<Long, com.crewcanvas.model.User> originalUserMap = userRepository.findAllById(originalUserIds).stream()
                    .collect(java.util.stream.Collectors.toMap(com.crewcanvas.model.User::getId, u -> u));

            java.util.Map<Long, Post> originalMap = new java.util.HashMap<>();
            for (Post op : originalPosts) {
                com.crewcanvas.model.User u = originalUserMap.get(op.getUserId());
                if (u != null) {
                    java.util.Map<String, Object> details = new java.util.HashMap<>();
                    details.put("id", u.getId());
                    details.put("name", u.getName());
                    details.put("role", u.getRole());
                    details.put("profilePicture", u.getProfilePicture());
                    op.setUserDetails(details);
                }
                originalMap.put(op.getId(), op);
            }
            
            posts.forEach(post -> {
                if (post.getOriginalPostId() != null) {
                    post.setOriginalPost(originalMap.get(post.getOriginalPostId()));
                }
            });
        }
    }

    private Post populatePollData(Post post) {
        populateExtraData(java.util.Collections.singletonList(post));
        return post;
    }
}
