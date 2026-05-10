package com.crewcanvas.dto;

import com.crewcanvas.model.User;

/**
 * Optimized User DTO for lists (Feed, Crew Search)
 * CC-SPEED-002: Lightweight DTO [Nelpatla Venkatesh]
 */
public class UserListDTO {
    private Long id;
    private String name;
    private String role;
    private String location;
    private String profilePicture;
    private String userType;
    private Boolean isVerifiedProfessional;
    private Integer profileScore;

    public UserListDTO() {}

    public UserListDTO(User user) {
        if (user == null) return;
        this.id = user.getId();
        this.name = user.getName();
        this.role = user.getRole();
        this.location = user.getLocation();
        this.profilePicture = user.getProfilePicture();
        this.userType = user.getUserType();
        this.isVerifiedProfessional = user.getIsVerifiedProfessional();
        this.profileScore = user.getProfileScore();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }
    public Boolean getIsVerifiedProfessional() { return isVerifiedProfessional; }
    public void setIsVerifiedProfessional(Boolean isVerifiedProfessional) { this.isVerifiedProfessional = isVerifiedProfessional; }
    public Integer getProfileScore() { return profileScore; }
    public void setProfileScore(Integer profileScore) { this.profileScore = profileScore; }
}
