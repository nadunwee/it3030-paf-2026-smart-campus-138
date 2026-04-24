package com.it3030.paf.smartcampus;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import com.it3030.paf.smartcampus.repository.NotificationRepository;
import com.it3030.paf.smartcampus.repository.TicketingRepository;
import com.it3030.paf.smartcampus.repository.TicketMessageRepository;
import com.it3030.paf.smartcampus.repository.UserAccountRepository;
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
public class BookingControllerTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private BookingRepository bookingRepository;
  @Autowired private FacilityResourceRepository facilityResourceRepository;
  @Autowired private NotificationRepository notificationRepository;
  @Autowired private TicketingRepository ticketingRepository;
  @Autowired private TicketMessageRepository ticketMessageRepository;
  @Autowired private UserAccountRepository userAccountRepository;

  @BeforeEach
  void setUp() {
    ticketMessageRepository.deleteAll();
    ticketingRepository.deleteAll();
    notificationRepository.deleteAll();
    bookingRepository.deleteAll();
    facilityResourceRepository.deleteAll();
    userAccountRepository.deleteAll();
  }

  @Test
  @WithMockUser(username = "alice", roles = "STUDENT")
  void createBooking_userCreatesPendingBooking() throws Exception {
    UserAccount alice = createUser("alice", AppRole.STUDENT);
    FacilityResource facility = createFacility("Hall A");

    String json =
        """
        {
          "facilityId": %d,
          "purpose": "Group study session",
          "durationMinutes": 120,
          "bookedFrom": "2026-05-01T09:00:00Z",
          "bookedTo": "2026-05-01T11:00:00Z"
        }
        """
            .formatted(facility.getId());

    mockMvc
        .perform(post("/api/v1/bookings").contentType("application/json").content(json))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.facilityId", is(facility.getId().intValue())))
        .andExpect(jsonPath("$.bookedByUserId", is(alice.getId().intValue())))
        .andExpect(jsonPath("$.bookedByUserName", is("alice")))
        .andExpect(jsonPath("$.status", is("PENDING")));
  }

  @Test
  @WithMockUser(username = "admin", roles = "ADMIN")
  void approveBooking_blocksOverlappingApproval() throws Exception {
    createUser("admin", AppRole.ADMIN);
    UserAccount alice = createUser("alice", AppRole.STUDENT);
    FacilityResource facility = createFacility("Lab 2");

    Booking first = createBooking(facility, alice, BookingStatus.PENDING, "2026-06-10T09:00:00Z", "2026-06-10T10:00:00Z");
    Booking second = createBooking(facility, alice, BookingStatus.PENDING, "2026-06-10T09:30:00Z", "2026-06-10T10:30:00Z");

    String approve = """
        { "status": "APPROVED" }
        """;

    mockMvc
        .perform(
            patch("/api/v1/bookings/{id}/decision", first.getBookingId())
                .contentType("application/json")
                .content(approve))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status", is("APPROVED")))
        .andExpect(jsonPath("$.approvedAt").isNotEmpty());

    mockMvc
        .perform(
            patch("/api/v1/bookings/{id}/decision", second.getBookingId())
                .contentType("application/json")
                .content(approve))
        .andExpect(status().isConflict());
  }

  @Test
  @WithMockUser(username = "admin", roles = "ADMIN")
  void rejectBooking_keepsFacilityAvailableForInterval() throws Exception {
    createUser("admin", AppRole.ADMIN);
    UserAccount alice = createUser("alice", AppRole.STUDENT);
    FacilityResource facility = createFacility("Room 204");

    Booking pending =
        createBooking(
            facility,
            alice,
            BookingStatus.PENDING,
            "2026-07-15T13:00:00Z",
            "2026-07-15T14:00:00Z");

    String reject = """
        { "status": "REJECTED" }
        """;

    mockMvc
        .perform(
            patch("/api/v1/bookings/{id}/decision", pending.getBookingId())
                .contentType("application/json")
                .content(reject))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status", is("REJECTED")));

    mockMvc
        .perform(
            get("/api/v1/resources")
                .param("availableFrom", "2026-07-15T13:00:00Z")
                .param("availableTo", "2026-07-15T14:00:00Z")
                .param("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].id", is(facility.getId().intValue())));
  }

  @Test
  @WithMockUser(username = "alice", roles = "STUDENT")
  void decisionEndpoint_userForbidden() throws Exception {
    UserAccount alice = createUser("alice", AppRole.STUDENT);
    FacilityResource facility = createFacility("Room 101");
    Booking pending =
        createBooking(
            facility,
            alice,
            BookingStatus.PENDING,
            "2026-08-01T08:00:00Z",
            "2026-08-01T09:00:00Z");

    mockMvc
        .perform(
            patch("/api/v1/bookings/{id}/decision", pending.getBookingId())
                .contentType("application/json")
                .content("{\"status\":\"APPROVED\"}"))
        .andExpect(status().isForbidden());
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
    facility.setType(ResourceType.MEETING_ROOM);
    facility.setCapacity(20);
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
    Booking booking = new Booking();
    booking.setFacilityResource(facility);
    booking.setBookedByUser(user);
    booking.setBookedByUserName(user.getUsername());
    booking.setFacilityName(facility.getType().name() + " - " + facility.getLocation());
    booking.setPurpose("Test booking");
    booking.setDurationMinutes(
        (int)
            java.time.Duration.between(OffsetDateTime.parse(fromIso), OffsetDateTime.parse(toIso))
                .toMinutes());
    booking.setBookedFrom(OffsetDateTime.parse(fromIso));
    booking.setBookedTo(OffsetDateTime.parse(toIso));
    booking.setStatus(status);
    booking.setApprovedAt(status == BookingStatus.APPROVED ? OffsetDateTime.now() : null);
    return bookingRepository.save(booking);
  }
}
