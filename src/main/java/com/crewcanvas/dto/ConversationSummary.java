package com.crewcanvas.dto;

import java.time.Instant;

public interface ConversationSummary {
    Long getOtherUserId();
    String getOtherUserName();
    String getOtherUserProfilePicture();
    String getOtherUserRole();
    String getLastMessage();
    Instant getLastMessageAt();
    boolean getIsRead();
}
