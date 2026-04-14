package com.crewcanvas.feed.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

// This tells Feign to look up "user-service" in Eureka and route requests there!
@FeignClient(name = "user-service")
public interface UserServiceClient {

    // This method signature exactly matches the User Service controller endpoint
    @GetMapping("/api/profile/{id}")
    UserDto getUserProfile(@PathVariable("id") Long id);

}
