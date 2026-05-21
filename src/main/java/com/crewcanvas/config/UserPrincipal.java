package com.crewcanvas.config;

import java.security.Principal;

public class UserPrincipal implements Principal {
    private final Long id;
    private final String email;
    private final boolean isAdmin;

    public UserPrincipal(Long id, String email, boolean isAdmin) {
        this.id = id;
        this.email = email;
        this.isAdmin = isAdmin;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public boolean isAdmin() {
        return isAdmin;
    }

    @Override
    public String getName() {
        return email;
    }
}
