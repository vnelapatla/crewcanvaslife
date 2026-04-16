package com.crewcanvas.service;

import com.crewcanvas.model.Post;
import com.crewcanvas.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PostService {

    @Autowired
    private PostRepository postRepository;

    public Post createPost(Long userId, String content, List<String> imageUrls, List<String> externalLinks) {
        Post post = new Post(userId, content, imageUrls, externalLinks);
        return postRepository.save(post);
    }

    public org.springframework.data.domain.Page<Post> getAllPosts(int page, int size) {
        return postRepository.findAllByOrderByCreatedAtDesc(org.springframework.data.domain.PageRequest.of(page, size));
    }

    public List<Post> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Post> getUserPosts(Long userId) {
        return postRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Optional<Post> getPostById(Long id) {
        return postRepository.findById(id);
    }

    public Post updatePost(Long id, Long requesterId, String content, List<String> imageUrls, List<String> externalLinks) {
        // FIXED Incident BF-303: Added ownership validation
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));
        
        if (requesterId == null || !post.getUserId().equals(requesterId)) {
            throw new RuntimeException("Unauthorized: You do not own this post");
        }

        if (content != null)
            post.setContent(content);
        if (imageUrls != null)
            post.setImageUrls(imageUrls);
        if (externalLinks != null)
            post.setExternalLinks(externalLinks);
        return postRepository.save(post);
    }

    public void deletePost(Long id, Long requesterId) {
        // FIXED Incident BF-303: Added ownership validation
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getUserId().equals(requesterId)) {
            throw new RuntimeException("Unauthorized: You do not own this post");
        }
        postRepository.delete(post);
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
}
