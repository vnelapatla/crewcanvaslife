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
    
    java.util.List<User> findTop10ByOrderByProfileScoreDesc();

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE " +
        "(:query IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.skills) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
        "(:role IS NULL OR LOWER(u.role) = LOWER(:role)) AND " +
        "(:location IS NULL OR LOWER(u.location) LIKE LOWER(CONCAT('%', :location, '%')))")
    java.util.List<User> searchUsers(@org.springframework.data.repository.query.Param("query") String query, 
                                     @org.springframework.data.repository.query.Param("role") String role, 
                                     @org.springframework.data.repository.query.Param("location") String location);
}
