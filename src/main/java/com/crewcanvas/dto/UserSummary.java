package com.crewcanvas.dto;

public interface UserSummary {
    Long getId();
    String getName();
    String getEmail();
    String getRole();
    String getLocation();
    String getPhone();
    String getUserType();
    Boolean getIsVerifiedProfessional();
    Boolean getIsAdmin();
    Integer getFollowers();
    Integer getFollowing();
    Integer getProfileScore();
    String getAgeRange();
    String getExperience();
    String getSkills();
    String getInstagram();
    String getYoutube();
    String getShowreel();
    String getPortfolioVideos();
}
