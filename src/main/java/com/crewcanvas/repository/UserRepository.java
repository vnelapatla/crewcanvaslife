package com.crewcanvas.repository;

import com.crewcanvas.model.User;
import com.crewcanvas.model.Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findByGoogleId(String googleId);
    List<User> findByClaimStatus(String claimStatus);
    long countByClaimStatus(String claimStatus);

    @org.springframework.data.jpa.repository.Query(
        value = "SELECT u FROM User u WHERE " +
            "(:currentUserId IS NULL OR u.id != :currentUserId) AND " +
            "(:excludeFollowed = false OR u.id NOT IN (SELECT c.followingId FROM Connection c WHERE c.followerId = :currentUserId)) AND " +
            "(:query IS NULL OR :query = '' OR LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.skills) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
            "(:role IS NULL OR :role = '' OR LOWER(u.role) = LOWER(:role)) AND " +
            "(:location IS NULL OR :location = '' OR LOWER(u.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
            "(:viewerRole IS NULL OR 1=1) AND (:viewerAgeRange IS NULL OR 1=1) " +
            "ORDER BY u.isVerifiedProfessional DESC, " +
            "u.profileScore DESC, " +
            "u.lastLogin DESC, " +
            "(CASE WHEN :viewerRole IS NOT NULL AND LOWER(u.role) = LOWER(:viewerRole) THEN 1 ELSE 0 END) DESC, " +
            "(CASE WHEN :viewerAgeRange IS NOT NULL AND u.ageRange = :viewerAgeRange THEN 1 ELSE 0 END) DESC, " +
            "u.followers DESC",
        countQuery = "SELECT count(u) FROM User u WHERE " +
            "(:currentUserId IS NULL OR u.id != :currentUserId) AND " +
            "(:excludeFollowed = false OR u.id NOT IN (SELECT c.followingId FROM Connection c WHERE c.followerId = :currentUserId)) AND " +
            "(:query IS NULL OR :query = '' OR LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.skills) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
            "(:role IS NULL OR :role = '' OR LOWER(u.role) = LOWER(:role)) AND " +
            "(:location IS NULL OR :location = '' OR LOWER(u.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
            "(:viewerRole IS NULL OR 1=1) AND (:viewerAgeRange IS NULL OR 1=1)"
    )
    org.springframework.data.domain.Page<User> searchUsers(
        @org.springframework.data.repository.query.Param("query") String query, 
        @org.springframework.data.repository.query.Param("role") String role, 
        @org.springframework.data.repository.query.Param("location") String location,
        @org.springframework.data.repository.query.Param("currentUserId") Long currentUserId,
        @org.springframework.data.repository.query.Param("viewerRole") String viewerRole,
        @org.springframework.data.repository.query.Param("viewerAgeRange") String viewerAgeRange,
        @org.springframework.data.repository.query.Param("excludeFollowed") boolean excludeFollowed,
        org.springframework.data.domain.Pageable pageable);

    boolean existsByEmail(String email);

    long countByCreatedAtAfter(java.time.LocalDateTime dateTime);
    long countByProfileScoreBetween(int min, int max);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE u.createdAt >= :dateTime ORDER BY u.createdAt DESC")
    java.util.List<User> findRecentSignups(@org.springframework.data.repository.query.Param("dateTime") java.time.LocalDateTime dateTime);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM users WHERE created_at >= :dateTime ORDER BY created_at DESC LIMIT 10", nativeQuery = true)
    java.util.List<User> findTop10RecentSignups(@org.springframework.data.repository.query.Param("dateTime") java.time.LocalDateTime dateTime);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u ORDER BY u.profileScore DESC, u.followers DESC")
    List<User> findTop10Users(org.springframework.data.domain.Pageable pageable);

    List<User> findAllByOrderByLastLoginDesc();

    @org.springframework.data.jpa.repository.Query("SELECT u.id as id, u.name as name, u.email as email, u.role as role, " +
            "u.location as location, u.phone as phone, u.userType as userType, " +
            "u.isVerifiedProfessional as isVerifiedProfessional, u.isAdmin as isAdmin, " +
            "u.followers as followers, u.following as following, u.profileScore as profileScore, " +
            "u.ageRange as ageRange, u.experience as experience, u.profilePicture as profilePicture, " +
            "u.skills as skills, u.instagram as instagram, u.youtube as youtube, " +
            "u.showreel as showreel, u.portfolioVideos as portfolioVideos " +
            "FROM User u WHERE " +
            "(:currentUserId IS NULL OR u.id != :currentUserId) AND " +
            "(:excludeFollowed = false OR u.id NOT IN (SELECT c.followingId FROM Connection c WHERE c.followerId = :currentUserId)) AND " +
            "(:query IS NULL OR :query = '' OR LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.skills) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
            "(:role IS NULL OR :role = '' OR LOWER(u.role) = LOWER(:role)) AND " +
            "(:location IS NULL OR :location = '' OR LOWER(u.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
            "(:viewerRole IS NULL OR 1=1) AND (:viewerAgeRange IS NULL OR 1=1) " +
            "ORDER BY u.isVerifiedProfessional DESC, " +
            "u.profileScore DESC, " +
            "u.lastLogin DESC, " +
            "(CASE WHEN :viewerRole IS NOT NULL AND LOWER(u.role) = LOWER(:viewerRole) THEN 1 ELSE 0 END) DESC, " +
            "(CASE WHEN :viewerAgeRange IS NOT NULL AND u.ageRange = :viewerAgeRange THEN 1 ELSE 0 END) DESC, " +
            "u.followers DESC")
    org.springframework.data.domain.Page<com.crewcanvas.dto.UserSummary> searchUsersSummary(
            @org.springframework.data.repository.query.Param("query") String query,
            @org.springframework.data.repository.query.Param("role") String role,
            @org.springframework.data.repository.query.Param("location") String location,
            @org.springframework.data.repository.query.Param("currentUserId") Long currentUserId,
            @org.springframework.data.repository.query.Param("viewerRole") String viewerRole,
            @org.springframework.data.repository.query.Param("viewerAgeRange") String viewerAgeRange,
            @org.springframework.data.repository.query.Param("excludeFollowed") boolean excludeFollowed,
            org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT u.id as id, u.name as name, u.email as email, u.role as role, " +
            "u.location as location, u.phone as phone, u.userType as userType, " +
            "u.isVerifiedProfessional as isVerifiedProfessional, u.isAdmin as isAdmin, " +
            "u.followers as followers, u.following as following, u.profileScore as profileScore, " +
            "u.ageRange as ageRange, u.experience as experience, u.skills as skills, " +
            "u.instagram as instagram, u.youtube as youtube, u.showreel as showreel, " +
            "u.portfolioVideos as portfolioVideos, u.profilePicture as profilePicture " +
            "FROM User u WHERE u.id IN :ids")
    List<com.crewcanvas.dto.UserSummary> findAllSummaryByIdIn(@org.springframework.data.repository.query.Param("ids") List<Long> ids);

    @org.springframework.data.jpa.repository.Query("SELECT u.id as id, u.name as name, u.email as email, u.role as role, " +
            "u.location as location, u.phone as phone, u.userType as userType, " +
            "u.isVerifiedProfessional as isVerifiedProfessional, u.isAdmin as isAdmin, " +
            "u.followers as followers, u.following as following, u.profileScore as profileScore, " +
            "u.ageRange as ageRange, u.experience as experience, u.profilePicture as profilePicture, " +
            "u.skills as skills, u.instagram as instagram, u.youtube as youtube, " +
            "u.showreel as showreel, u.portfolioVideos as portfolioVideos " +
            "FROM User u WHERE u.id = :id")
    Optional<com.crewcanvas.dto.UserSummary> findSummaryById(@org.springframework.data.repository.query.Param("id") Long id);

    @org.springframework.data.jpa.repository.Query("SELECT u.id, u.name, u.role, u.profilePicture FROM User u WHERE u.id IN :ids")
    List<Object[]> findPostUserDetailsByIds(@org.springframework.data.repository.query.Param("ids") List<Long> ids);
}
