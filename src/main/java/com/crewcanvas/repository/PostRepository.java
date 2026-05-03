package com.crewcanvas.repository;

import com.crewcanvas.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByUserIdOrderByCreatedAtDesc(Long userId);
    org.springframework.data.domain.Page<Post> findByUserIdOrderByCreatedAtDesc(Long userId, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Post> findAllByOrderByCreatedAtDesc(org.springframework.data.domain.Pageable pageable);

    List<Post> findAllByOrderByCreatedAtDesc();

    // CC-MAY-004: Stability Fix [T Dheeraj] - Simplified JPQL to resolve Hibernate 6 validation crash.
    @Query("SELECT p FROM Post p WHERE p.content LIKE :keyword OR p.poll.question LIKE :keyword OR p.user.name LIKE :keyword ORDER BY p.createdAt DESC")
    org.springframework.data.domain.Page<Post> searchByKeyword(@Param("keyword") String keyword, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT p FROM Post p JOIN p.user u WHERE (p.content LIKE :keyword OR p.poll.question LIKE :keyword OR u.name LIKE :keyword) AND p.createdAt >= :sinceDate ORDER BY p.createdAt DESC")
    org.springframework.data.domain.Page<Post> searchByKeywordAndTime(@Param("keyword") String keyword, @Param("sinceDate") java.time.LocalDateTime sinceDate, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT p FROM Post p LEFT JOIN p.user u LEFT JOIN p.poll pol WHERE " +
           "(p.content LIKE :keyword OR pol.question LIKE :keyword OR u.name LIKE :keyword) " +
           "AND (:sinceDate IS NULL OR p.createdAt >= :sinceDate) " +
           "AND (:contentType IS NULL " +
           "OR (:contentType = 'images' AND p.imageUrls IS NOT EMPTY AND NOT EXISTS (SELECT img FROM p.imageUrls img WHERE img LIKE 'data:video/%')) " +
           "OR (:contentType = 'videos' AND EXISTS (SELECT img FROM p.imageUrls img WHERE img LIKE 'data:video/%')) " +
           "OR (:contentType = 'polls' AND p.poll IS NOT NULL)) " +
           "ORDER BY " +
           "CASE WHEN :sortBy = 'latest' THEN p.createdAt END DESC, " +
           "CASE WHEN :sortBy = 'top' THEN (p.likes + p.comments) END DESC, p.id DESC")
    org.springframework.data.domain.Page<Post> searchAdvanced(
            @Param("keyword") String keyword, 
            @Param("sinceDate") java.time.LocalDateTime sinceDate, 
            @Param("contentType") String contentType, 
            @Param("sortBy") String sortBy, 
            org.springframework.data.domain.Pageable pageable);
    
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
