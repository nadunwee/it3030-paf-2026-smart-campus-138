package com.it3030.paf.smartcampus;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.it3030.paf.smartcampus.domain.Booking;
import com.it3030.paf.smartcampus.domain.FacilityResource;
import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.BookingStatus;
import com.it3030.paf.smartcampus.domain.enums.ResourceStatus;
import com.it3030.paf.smartcampus.domain.enums.ResourceType;
import com.it3030.paf.smartcampus.repository.BookingRepository;
import com.it3030.paf.smartcampus.repository.FacilityResourceRepository;
import com.it3030.paf.smartcampus.repository.UserAccountRepository;
import java.time.Duration;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class DashboardControllerTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private BookingRepository bookingRepository;
  @Autowired private FacilityResourceRepository facilityResourceRepository;
  @Autowired private UserAccountRepository userAccountRepository;

  @BeforeEach
  void setUp() {
    bookingRepository.deleteAll();
    facilityResourceRepository.deleteAll();
    userAccountRepository.deleteAll();
  }

  @Test
  @WithMockUser(username = "alice", roles = "USER")
  void summary_userGetsFacilityCountAndMonth() throws Exception {
    createUser("alice", AppRole.USER);
    createFacility("Building A");
    createFacility("Building B");

    mockMvc
        .perform(get("/api/v1/dashboard/summary"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.activeFacilitiesCount", is(2)))
        .andExpect(jsonPath("$.currentMonthLabel").isNotEmpty())
        .andExpect(jsonPath("$.pendingApprovals").isEmpty());
  }

  @Test
  @WithMockUser(username = "admin", roles = "ADMIN")
  void summary_adminGetsPendingApprovalCount() throws Exception {
    createUser("admin", AppRole.ADMIN);
    UserAccount alice = createUser("alice", AppRole.USER);
    FacilityResource facility = createFacility("Auditorium");

    createBooking(facility, alice, BookingStatus.PENDING, "2026-09-01T09:00:00Z", "2026-09-01T10:00:00Z");
    createBooking(facility, alice, BookingStatus.PENDING, "2026-09-02T09:00:00Z", "2026-09-02T10:00:00Z");

    mockMvc
        .perform(get("/api/v1/dashboard/summary"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.activeFacilitiesCount", greaterThan(0)))
        .andExpect(jsonPath("$.pendingApprovals", is(2)));
  }

  private UserAccount createUser(String username, AppRole role) {
    UserAccount user = new UserAccount();
    user.setUsername(username);
    user.setPasswordHash("hash");
    user.setRole(role);
    return userAccountRepository.save(user);
  }

  private FacilityResource createFacility(String location) {
    FacilityResource facility = new FacilityResource();
    facility.setType(ResourceType.LECTURE_HALL);
    facility.setCapacity(100);
    facility.setLocation(location);
    facility.setStatus(ResourceStatus.ACTIVE);
    facility.setDeleted(false);
    return facilityResourceRepository.save(facility);
  }

  private Booking createBooking(
      FacilityResource facility,
      UserAccount user,
      BookingStatus status,
      String fromIso,
      String toIso) {
    OffsetDateTime from = OffsetDateTime.parse(fromIso);
    OffsetDateTime to = OffsetDateTime.parse(toIso);

    Booking booking = new Booking();
    booking.setFacilityResource(facility);
    booking.setBookedByUser(user);
    booking.setBookedByUserName(user.getUsername());
    booking.setFacilityName(facility.getType().name() + " - " + facility.getLocation());
    booking.setPurpose("Dashboard test");
    booking.setDurationMinutes((int) Duration.between(from, to).toMinutes());
    booking.setBookedFrom(from);
    booking.setBookedTo(to);
    booking.setStatus(status);
    booking.setApprovedAt(status == BookingStatus.APPROVED ? OffsetDateTime.now() : null);
    return bookingRepository.save(booking);
  }
}
