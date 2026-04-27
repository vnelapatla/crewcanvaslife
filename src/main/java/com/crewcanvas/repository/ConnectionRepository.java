package com.crewcanvas.repository;

import com.crewcanvas.model.Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, Long> {
    Optional<Connection> findByFollowerIdAndFollowingId(Long followerId, Long followingId);
    List<Connection> findByFollowerId(Long followerId);
    List<Connection> findByFollowingId(Long followingId);
    
    @Transactional
    void deleteByFollowerId(Long followerId);
    
    @Transactional
    void deleteByFollowingId(Long followingId);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM followers WHERE follower_id = ?1 OR following_id = ?1", nativeQuery = true)
    void deleteFromFollowersTable(Long userId);
}
