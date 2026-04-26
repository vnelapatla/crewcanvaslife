package com.crewcanvas.repository;

import com.crewcanvas.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByUserIdOrderByCreatedAtDesc(Long userId);
    org.springframework.data.domain.Page<Post> findByUserIdOrderByCreatedAtDesc(Long userId, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Post> findAllByOrderByCreatedAtDesc(org.springframework.data.domain.Pageable pageable);

    List<Post> findAllByOrderByCreatedAtDesc();
    
    @org.springframework.transaction.annotation.Transactional
    void deleteByUserId(Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM post_likes_users WHERE user_id = ?1", nativeQuery = true)
    void deleteUserLikes(Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM post_likes_users WHERE post_id IN (SELECT p.id FROM posts p WHERE p.user_id = ?1)", nativeQuery = true)
    void deleteLikesOnUserPosts(Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM post_actual_comments WHERE post_id IN (SELECT p.id FROM posts p WHERE p.user_id = ?1)", nativeQuery = true)
    void deleteCommentsOnUserPosts(Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM post_images WHERE post_id IN (SELECT p.id FROM posts p WHERE p.user_id = ?1)", nativeQuery = true)
    void deleteImagesOnUserPosts(Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM post_links WHERE post_id IN (SELECT p.id FROM posts p WHERE p.user_id = ?1)", nativeQuery = true)
    void deleteLinksOnUserPosts(Long userId);
}
