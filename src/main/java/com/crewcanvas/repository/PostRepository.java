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
}
