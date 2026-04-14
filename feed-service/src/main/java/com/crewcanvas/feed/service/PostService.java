package com.crewcanvas.feed.service;

import com.crewcanvas.feed.model.Post;
import com.crewcanvas.feed.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PostService {

    @Autowired
    private PostRepository postRepository;

    public Post createPost(Long userId, String content, String imageUrl) {
        Post post = new Post(userId, content, imageUrl);
        return postRepository.save(post);
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

    public Post updatePost(Long id, String content, String imageUrl) {
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            if (content != null)
                post.setContent(content);
            if (imageUrl != null)
                post.setImageUrl(imageUrl);
            return postRepository.save(post);
        }
        throw new RuntimeException("Post not found");
    }

    public void deletePost(Long id) {
        postRepository.deleteById(id);
    }

    public Post likePost(Long id) {
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            post.setLikes(post.getLikes() + 1);
            return postRepository.save(post);
        }
        throw new RuntimeException("Post not found");
    }

    public Post addComment(Long id) {
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            post.setComments(post.getComments() + 1);
            return postRepository.save(post);
        }
        throw new RuntimeException("Post not found");
    }
}
