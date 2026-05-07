package com.crewcanvas.dto;

public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String location;
    private String phone;
    private String userType;
    private Boolean isVerifiedProfessional;
    private Boolean isAdmin;
    private Integer followers;
    private Integer following;
    private Integer profileScore;
    private String profilePicture;

    public UserDTO() {}

    public UserDTO(com.crewcanvas.dto.UserSummary summary) {
        this.id = summary.getId();
        this.name = summary.getName();
        this.email = summary.getEmail();
        this.role = summary.getRole();
        this.location = summary.getLocation();
        this.phone = summary.getPhone();
        this.userType = summary.getUserType();
        this.isVerifiedProfessional = summary.getIsVerifiedProfessional();
        this.isAdmin = summary.getIsAdmin();
        this.followers = summary.getFollowers();
        this.following = summary.getFollowing();
        this.profileScore = summary.getProfileScore();
        this.profilePicture = summary.getProfilePicture();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }
    public Boolean getIsVerifiedProfessional() { return isVerifiedProfessional; }
    public void setIsVerifiedProfessional(Boolean isVerifiedProfessional) { this.isVerifiedProfessional = isVerifiedProfessional; }
    public Boolean getIsAdmin() { return isAdmin; }
    public void setIsAdmin(Boolean isAdmin) { this.isAdmin = isAdmin; }
    public Integer getFollowers() { return followers; }
    public void setFollowers(Integer followers) { this.followers = followers; }
    public Integer getFollowing() { return following; }
    public void setFollowing(Integer following) { this.following = following; }
    public Integer getProfileScore() { return profileScore; }
    public void setProfileScore(Integer profileScore) { this.profileScore = profileScore; }
    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
}
