package com.crewcanvas.dto;

import lombok.Data;

@Data
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
    private String profilePicture; // We might want a small version or just the URL if it's external, but here it's likely base64. 
    // Actually, for search results, we usually DO need the profile picture. 
    // But maybe we should fetch it separately or only if it's not too large.
    // Let's include it for now but be aware.

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
    }
}
