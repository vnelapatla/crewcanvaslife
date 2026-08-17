package com.crewcanvas;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BCryptHashGenerator {
    public static void main(String[] args) {
        String pwd = args.length > 0 ? args[0] : "Kamesh@123";
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println("RAW_PASSWORD: " + pwd);
        System.out.println("BCRYPT_HASH: " + encoder.encode(pwd));
    }
}
