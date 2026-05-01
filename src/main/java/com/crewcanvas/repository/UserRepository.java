package com.crewcanvas.repository;

import com.crewcanvas.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    java.util.List<User> findTop3ByOrderByFollowersDesc();
    
    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u ORDER BY u.isVerifiedProfessional DESC, u.followers DESC, u.profileScore DESC")
    java.util.List<User> findTop10Users(org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE " +
        "(:currentUserId IS NULL OR u.id != :currentUserId) AND " +
        "(:excludeFollowed = false OR u.id NOT IN (SELECT c.followingId FROM Connection c WHERE c.followerId = :currentUserId)) AND " +
        "(:query IS NULL OR :query = '' OR LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.skills) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
        "(:role IS NULL OR :role = '' OR LOWER(u.role) = LOWER(:role)) AND " +
        "(:location IS NULL OR :location = '' OR LOWER(u.location) LIKE LOWER(CONCAT('%', :location, '%'))) " +
        "ORDER BY u.isVerifiedProfessional DESC, u.followers DESC, u.profileScore DESC")
    org.springframework.data.domain.Page<User> searchUsers(
        @org.springframework.data.repository.query.Param("query") String query, 
        @org.springframework.data.repository.query.Param("role") String role, 
        @org.springframework.data.repository.query.Param("location") String location,
        @org.springframework.data.repository.query.Param("currentUserId") Long currentUserId,
        @org.springframework.data.repository.query.Param("excludeFollowed") boolean excludeFollowed,
        org.springframework.data.domain.Pageable pageable);
}
