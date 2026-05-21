package com.crewcanvas.dto;

public interface ConversationSummary {
    Long getOtherUserId();
    String getOtherUserName();
    String getOtherUserProfilePicture();
    String getOtherUserRole();
    String getLastMessage();
    String getLastMessageAt();
    boolean getIsRead();
}
