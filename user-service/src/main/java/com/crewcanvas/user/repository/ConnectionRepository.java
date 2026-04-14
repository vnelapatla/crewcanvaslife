package com.crewcanvas.user.repository;

import com.crewcanvas.user.model.Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, Long> {

    Optional<Connection> findByFollowerIdAndFollowingId(Long followerId, Long followingId);

    List<Connection> findByFollowerId(Long followerId);

    List<Connection> findByFollowingId(Long followingId);

    @Query("SELECT COUNT(c) FROM Connection c WHERE c.followingId = ?1")
    Long countFollowers(Long userId);

    @Query("SELECT COUNT(c) FROM Connection c WHERE c.followerId = ?1")
    Long countFollowing(Long userId);

    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);
}
