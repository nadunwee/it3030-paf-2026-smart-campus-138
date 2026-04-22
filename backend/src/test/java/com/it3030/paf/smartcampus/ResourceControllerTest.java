package com.it3030.paf.smartcampus;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.it3030.paf.smartcampus.api.dto.ResourceCreateRequest;
import com.it3030.paf.smartcampus.api.dto.ResourcePatchRequest;
import com.it3030.paf.smartcampus.domain.AvailabilityWindow;
import com.it3030.paf.smartcampus.domain.FacilityResource;
import com.it3030.paf.smartcampus.domain.Notification;
import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.ResourceStatus;
import com.it3030.paf.smartcampus.domain.enums.ResourceType;
import com.it3030.paf.smartcampus.repository.FacilityResourceRepository;
import com.it3030.paf.smartcampus.repository.NotificationRepository;
import com.it3030.paf.smartcampus.repository.UserAccountRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.security.test.context.support.WithMockUser;
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
public class ResourceControllerTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private FacilityResourceRepository repository;
  @Autowired private NotificationRepository notificationRepository;
  @Autowired private UserAccountRepository userAccountRepository;
  @Autowired private ObjectMapper objectMapper;

  @BeforeEach
  void setUp() {
    notificationRepository.deleteAll();
    repository.deleteAll();
    userAccountRepository.deleteAll();
  }

  @Test
  @WithMockUser(roles = "STUDENT")
  void postResources_userForbidden() throws Exception {
    String json =
        """
        {
          "type":"LECTURE_HALL",
          "capacity":100,
          "location":"Room A",
          "status":"ACTIVE",
          "availabilityWindows":[]
        }
        """;

    mockMvc
        .perform(post("/api/v1/resources").contentType("application/json").content(json))
        .andExpect(status().isForbidden());
  }

  @Test
  @WithMockUser(roles = "STUDENT")
  void getResources_userSeesOnlyActive() throws Exception {
    FacilityResource active = new FacilityResource();
    active.setType(ResourceType.LAB);
    active.setCapacity(30);
    active.setLocation("Lab 1");
    active.setStatus(ResourceStatus.ACTIVE);
    repository.save(active);

    FacilityResource out =
        new FacilityResource();
    out.setType(ResourceType.LAB);
    out.setCapacity(25);
    out.setLocation("Lab 2");
    out.setStatus(ResourceStatus.OUT_OF_SERVICE);
    repository.save(out);

    mockMvc
        .perform(get("/api/v1/resources").param("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[*].status", everyItem(is("ACTIVE"))));
  }

  @Test
  @WithMockUser(roles = "STUDENT")
  void getResources_availableOnFiltersAvailabilityWindow() throws Exception {
    OffsetDateTime dt = OffsetDateTime.parse("2026-03-23T11:00:00Z");
    FacilityResource active1 = new FacilityResource();
    active1.setType(ResourceType.EQUIPMENT);
    active1.setCapacity(5);
    active1.setLocation("Projector 1");
    active1.setStatus(ResourceStatus.ACTIVE);

    AvailabilityWindow w1 = new AvailabilityWindow();
    w1.setStartDateTime(OffsetDateTime.parse("2026-03-23T10:00:00Z"));
    w1.setEndDateTime(OffsetDateTime.parse("2026-03-23T12:00:00Z"));
    w1.setResource(active1);
    active1.getAvailabilityWindows().add(w1);
    repository.save(active1);

    FacilityResource active2 = new FacilityResource();
    active2.setType(ResourceType.EQUIPMENT);
    active2.setCapacity(5);
    active2.setLocation("Projector 2");
    active2.setStatus(ResourceStatus.ACTIVE);

    AvailabilityWindow w2 = new AvailabilityWindow();
    w2.setStartDateTime(OffsetDateTime.parse("2026-03-23T13:00:00Z"));
    w2.setEndDateTime(OffsetDateTime.parse("2026-03-23T14:00:00Z"));
    w2.setResource(active2);
    active2.getAvailabilityWindows().add(w2);
    repository.save(active2);

    mockMvc
        .perform(
            get("/api/v1/resources")
                .param("availableOn", dt.toString())
                .param("size", "10")
        )
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].id", is(active1.getId().intValue())));
  }

  @Test
  @WithMockUser(roles = "ADMIN")
  void patchResources_adminUpdatesCapacity() throws Exception {
    FacilityResource active = new FacilityResource();
    active.setType(ResourceType.MEETING_ROOM);
    active.setCapacity(10);
    active.setLocation("Room 101");
    active.setStatus(ResourceStatus.ACTIVE);
    repository.save(active);

    ResourcePatchRequest patch = new ResourcePatchRequest();
    patch.setCapacity(99);
    String json = objectMapper.writeValueAsString(patch);

    mockMvc
        .perform(
            patch("/api/v1/resources/{id}", active.getId())
                .contentType("application/json")
                .content(json)
        )
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.capacity", is(99)));
  }

  @Test
  @WithMockUser(username = "admin1", roles = "ADMIN")
  void postResources_adminCreate_notifiesRelevantUsersIndividually() throws Exception {
    createUser("admin1", AppRole.ADMIN);
    createUser("admin2", AppRole.ADMIN);
    UserAccount alice = createUser("alice", AppRole.STUDENT);
    UserAccount bob = createUser("bob", AppRole.STUDENT);

    String json =
        """
        {
          "type":"LECTURE_HALL",
          "capacity":100,
          "location":"Room X",
          "status":"ACTIVE",
          "availabilityWindows":[]
        }
        """;

    mockMvc
        .perform(post("/api/v1/resources").contentType("application/json").content(json))
        .andExpect(status().isCreated());

    List<Notification> aliceNotifications =
        notificationRepository.findByTargetUserIdOrderByCreatedAtDesc(
            alice.getId(), org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
    List<Notification> bobNotifications =
        notificationRepository.findByTargetUserIdOrderByCreatedAtDesc(
            bob.getId(), org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
    List<Notification> adminNotifications =
        notificationRepository.findByTargetUserIdOrderByCreatedAtDesc(
            userAccountRepository.findByUsername("admin1").orElseThrow().getId(),
            org.springframework.data.domain.PageRequest.of(0, 10)).getContent();

    org.junit.jupiter.api.Assertions.assertEquals(1, aliceNotifications.size());
    org.junit.jupiter.api.Assertions.assertEquals(1, bobNotifications.size());
    org.junit.jupiter.api.Assertions.assertTrue(adminNotifications.isEmpty());
    org.junit.jupiter.api.Assertions.assertNotEquals(
        aliceNotifications.get(0).getNotificationId(), bobNotifications.get(0).getNotificationId());
  }

  private UserAccount createUser(String username, AppRole role) {
    UserAccount user = new UserAccount();
    user.setUsername(username);
    user.setPasswordHash("hash");
    user.setRole(role);
    return userAccountRepository.save(user);
  }
}
