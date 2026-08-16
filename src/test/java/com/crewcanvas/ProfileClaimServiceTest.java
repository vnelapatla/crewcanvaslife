package com.crewcanvas;

import com.crewcanvas.model.User;
import com.crewcanvas.repository.ProfileClaimInvitationRepository;
import com.crewcanvas.repository.UserRepository;
import com.crewcanvas.service.ProfileClaimService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@SpringBootTest
@Transactional
@org.springframework.test.context.ActiveProfiles("test")
public class ProfileClaimServiceTest {

    @Autowired
    private ProfileClaimService profileClaimService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileClaimInvitationRepository invitationRepository;

    @Test
    public void testCreateUnclaimedProfileAndTokenGeneration() {
        User inputUser = new User();
        inputUser.setName("Test Actor");
        inputUser.setRole("Lead Actor");
        inputUser.setPhone("+919999988888");

        Map<String, Object> result = profileClaimService.createUnclaimedProfile(inputUser, 1L);
        Assertions.assertNotNull(result);

        User createdProfile = (User) result.get("profile");
        Assertions.assertNotNull(createdProfile);
        Assertions.assertEquals("UNCLAIMED", createdProfile.getClaimStatus());
        Assertions.assertEquals("Test Actor", createdProfile.getName());

        String rawToken = (String) result.get("rawToken");
        Assertions.assertNotNull(rawToken);
        Assertions.assertFalse(rawToken.isEmpty());

        // Validate token
        Map<String, Object> preview = profileClaimService.validateClaimToken(rawToken);
        Assertions.assertTrue((Boolean) preview.get("valid"));
        Assertions.assertEquals("Test Actor", preview.get("actorName"));
    }

    @Test
    public void testCompleteProfileClaim() {
        User inputUser = new User();
        inputUser.setName("Claimable Actor");
        inputUser.setPhone("+918888877777");

        Map<String, Object> initResult = profileClaimService.createUnclaimedProfile(inputUser, 1L);
        String rawToken = (String) initResult.get("rawToken");

        Map<String, Object> claimResult = profileClaimService.completeProfileClaim(rawToken, "+918888877777", "claimedactor@crewcanvas.in", "Claimable Actor");
        Assertions.assertNotNull(claimResult);

        User claimedUser = (User) claimResult.get("user");
        Assertions.assertEquals("CLAIMED", claimedUser.getClaimStatus());
        Assertions.assertNotNull(claimResult.get("token"));

        // Second claim attempt should fail
        Assertions.assertThrows(IllegalStateException.class, () -> {
            profileClaimService.completeProfileClaim(rawToken, "+918888877777", "claimedactor@crewcanvas.in", "Claimable Actor");
        });
    }

    @Test
    public void testInvalidTokenRejection() {
        Assertions.assertThrows(IllegalArgumentException.class, () -> {
            profileClaimService.validateClaimToken("invalid-non-existent-token-12345");
        });
    }
}
