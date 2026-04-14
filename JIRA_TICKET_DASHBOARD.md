# 🏢 BackendForge Jira Dashboard

Welcome to the team, Engineer! You've been assigned the following urgent production incidents. Your task is to **Reproduce**, **Debug**, and **Resolve** each one using the industry-standard workflow.

---

## 🔴 [Active] Incident BF-001: Random 500 Error on User Registration
- **Priority:** High
- **Assigned:** YOU
- **Status:** To Do
- **Description:** A specific user reported that they couldn't register. Every time they try, they see an "Unexpected System Error" (ID: BF-X920).
- **Reproduction:** Try to register the SAME email twice.
- **Expected:** Friendly message: *"Email already registered."*
- **Actual:** generic 500 Internal Server Error.
- **Hint:** Check the **Eclipse Console Logs** for `[PRODUCTION_LOG_ERROR]`.

---

## 🟠 [Active] Incident BF-102: "Sudden Reset" - Profile Data Loss
- **Priority:** Medium
- **Assigned:** YOU
- **Status:** To Do
- **Description:** User reported that updating their "Bio" in Settings wipes out their "Role" and "Location" fields from their profile.
- **Reproduction:** Set a Role and Location -> Update Bio -> Refresh Profile.
- **Expected:** Only the Bio changes; others stay the same.
- **Actual:** Bio updates, but other fields are set to NULL or 0.

---

## 🔴 [Active] Incident BF-303: "The Unauthorized Deleter" (Security Vulnerability)
- **Priority:** Critical (Security)
- **Assigned:** YOU
- **Status:** To Do
- **Description:** Our security scan found that users can delete *any* post on the platform via the API without being the owner.
- **Reproduction:** Create a post as User A -> Try to delete it (using ID) as User B.
- **Expected:** Forbidden (403) or Unauthorized.
- **Actual:** Post is successfully deleted.
- **Hint:** Check the `PostController` for ownership logic.

---

## 🟡 [Active] Incident BF-404: "The Crawling Feed" (Performance Trap)
- **Priority:** Low
- **Assigned:** YOU
- **Status:** To Do
- **Description:** Power users with many posts are reporting that the Feed page is significantly slower than it was last month.
- **Reproduction:** As the number of posts grows (try adding 10-20), notice the significant delay in API response.
- **Expected:** Sub-500ms response.
- **Actual:** 5+ seconds for even a small list.

---

## 🟠 [Active] Incident BF-505: "Ghost Gains" - Follower Count Inconsistency
- **Priority:** Medium
- **Assigned:** YOU
- **Status:** To Do
- **Description:** Users are reporting that their Follower/Following counts are "making no sense." A user follow counts increasing for the wrong person.
- **Reproduction:** User A follows User B. Check A's profile and B's profile.
- **Expected:** A.following (+1), B.followers (+1).
- **Actual:** A.followers (+1) and B.following (+1).

---

### 🚀 Workflow for Resolution:
1.  **Read** the Ticket.
2.  **Verify** the bug in the running application (Eclipse + Browser/Postman).
3.  **Trace** the code in the Monolith using Step-over debugging.
4.  **Fix** the code.
5.  **Test** to ensure the bug is dead.
