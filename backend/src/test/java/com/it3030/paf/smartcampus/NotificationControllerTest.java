package com.it3030.paf.smartcampus;

import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.it3030.paf.smartcampus.domain.Notification;
import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.NotificationType;
import com.it3030.paf.smartcampus.domain.enums.RelatedEntityType;
import com.it3030.paf.smartcampus.repository.NotificationRepository;
import com.it3030.paf.smartcampus.repository.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class NotificationControllerTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private NotificationRepository notificationRepository;
  @Autowired private UserAccountRepository userAccountRepository;

  @BeforeEach
  void setUp() {
    notificationRepository.deleteAll();
    userAccountRepository.deleteAll();
  }

  @Test
  void userCanListMarkReadDeleteAndClearOwnNotifications() throws Exception {
    UserAccount alice = createUser("alice", AppRole.STUDENT);
    UserAccount bob = createUser("bob", AppRole.STUDENT);

    Notification aliceNotification = createNotification(alice, "Alice Notification");
    createNotification(bob, "Bob Notification");

    mockMvc
        .perform(get("/api/v1/notifications").with(user("alice").roles("STUDENT")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()", is(1)))
        .andExpect(jsonPath("$.content[0].title", is("Alice Notification")));

    mockMvc
        .perform(patch("/api/v1/notifications/{id}/read", aliceNotification.getNotificationId()).with(user("alice").roles("STUDENT")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.isRead", is(true)));

    mockMvc
        .perform(get("/api/v1/notifications/unread/count").with(user("alice").roles("STUDENT")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.unreadCount", is(0)));

    mockMvc
        .perform(delete("/api/v1/notifications/{id}", aliceNotification.getNotificationId()).with(user("alice").roles("STUDENT")))
        .andExpect(status().isNoContent());

    createNotification(alice, "One");
    createNotification(alice, "Two");

    mockMvc
        .perform(delete("/api/v1/notifications").with(user("alice").roles("STUDENT")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count", is(2)));
  }

  @Test
  void adminCanCreateManualNotification_userCannot() throws Exception {
    UserAccount admin = createUser("admin", AppRole.ADMIN);
    UserAccount alice = createUser("alice", AppRole.STUDENT);

    String payload =
        """
        {
          "userId": %d,
          "title": "Maintenance window",
          "message": "System maintenance tonight",
          "type": "SYSTEM",
          "relatedEntityType": "SYSTEM",
          "actionUrl": "/dashboard"
        }
        """
            .formatted(alice.getId());

    mockMvc
        .perform(post("/api/v1/notifications").with(user(admin.getUsername()).roles("ADMIN")).contentType("application/json").content(payload))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.title", is("Maintenance window")));

    mockMvc
        .perform(post("/api/v1/notifications").with(user("alice").roles("STUDENT")).contentType("application/json").content(payload))
        .andExpect(status().isForbidden());
  }

  private UserAccount createUser(String username, AppRole role) {
    UserAccount user = new UserAccount();
    user.setUsername(username);
    user.setPasswordHash("hash");
    user.setRole(role);
    return userAccountRepository.save(user);
  }

  private Notification createNotification(UserAccount targetUser, String title) {
    Notification notification = new Notification();
    notification.setTargetUser(targetUser);
    notification.setUserRole(targetUser.getRole());
    notification.setTitle(title);
    notification.setMessage("Message");
    notification.setType(NotificationType.SYSTEM);
    notification.setRelatedEntityType(RelatedEntityType.SYSTEM);
    notification.setRelatedEntityId(null);
    notification.setRead(false);
    notification.setActionUrl("/dashboard");
    return notificationRepository.save(notification);
  }
}
