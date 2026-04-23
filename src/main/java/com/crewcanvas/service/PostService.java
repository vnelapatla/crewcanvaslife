package com.crewcanvas.service;

import com.crewcanvas.model.Post;
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

    public Post createPost(Long userId, String content, List<String> imageUrls, List<String> externalLinks) {
        Post post = new Post(userId, content, imageUrls, externalLinks);
        return postRepository.save(post);
    }

    public Post createPoll(Long userId, String question, List<String> options) {
        Post post = new Post(userId, question);
        com.crewcanvas.model.Poll poll = new com.crewcanvas.model.Poll(question);
        
        for (String optText : options) {
            poll.addOption(new com.crewcanvas.model.PollOption(optText));
        }
        
        post.setPoll(poll);
        return populatePollData(postRepository.save(post));
    }

    public org.springframework.data.domain.Page<Post> getAllPosts(int page, int size) {
        org.springframework.data.domain.Page<Post> posts = postRepository.findAllByOrderByCreatedAtDesc(org.springframework.data.domain.PageRequest.of(page, size));
        posts.getContent().forEach(this::populatePollData);
        return posts;
    }

    public List<Post> getAllPosts() {
        return populatePollData(postRepository.findAllByOrderByCreatedAtDesc());
    }

    public org.springframework.data.domain.Page<Post> getUserPosts(Long userId, int page, int size) {
        org.springframework.data.domain.Page<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(userId, org.springframework.data.domain.PageRequest.of(page, size));
        posts.getContent().forEach(this::populatePollData);
        return posts;
    }

    public Optional<Post> getPostById(Long id) {
        return postRepository.findById(id).map(this::populatePollData);
    }

    public Post updatePost(Long id, String content, List<String> imageUrls, List<String> externalLinks) {
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            if (content != null)
                post.setContent(content);
            if (imageUrls != null)
                post.setImageUrls(imageUrls);
            if (externalLinks != null)
                post.setExternalLinks(externalLinks);
            return postRepository.save(post);
        }
        throw new RuntimeException("Post not found");
    }

    public void deletePost(Long id) {
        postRepository.deleteById(id);
    }

    public Post likePost(Long id, Long userId) {
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            if (post.getLikedByUsers().contains(userId)) {
                post.getLikedByUsers().remove(userId);
                post.setLikes(post.getLikes() - 1);
            } else {
                post.getLikedByUsers().add(userId);
                post.setLikes(post.getLikes() + 1);
            }
            return postRepository.save(post);
        }
        throw new RuntimeException("Post not found");
    }

    public Post addComment(Long id, String text) {
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            post.setComments(post.getComments() + 1);
            if (text != null && !text.isEmpty()) {
                post.getActualComments().add(text);
            }
            return postRepository.save(post);
        }
        throw new RuntimeException("Post not found");
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

    private Post populatePollData(Post post) {
        if (post.getPoll() != null) {
            com.crewcanvas.model.Poll poll = post.getPoll();
            List<com.crewcanvas.model.PollVote> votes = pollVoteRepository.findByPollId(poll.getId());
            java.util.Map<Long, Integer> voteMap = new java.util.HashMap<>();
            
            // Map option IDs to their indices for frontend compatibility
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
        }
        return post;
    }

    private List<Post> populatePollData(List<Post> posts) {
        posts.forEach(this::populatePollData);
        return posts;
    }
}
