package com.it3030.paf.smartcampus;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.it3030.paf.smartcampus.domain.Booking;
import com.it3030.paf.smartcampus.domain.FacilityResource;
import com.it3030.paf.smartcampus.domain.Ticketing;
import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.BookingStatus;
import com.it3030.paf.smartcampus.domain.enums.ResourceStatus;
import com.it3030.paf.smartcampus.domain.enums.ResourceType;
import com.it3030.paf.smartcampus.domain.enums.TicketCategory;
import com.it3030.paf.smartcampus.domain.enums.TicketPriority;
import com.it3030.paf.smartcampus.domain.enums.TicketStatus;
import com.it3030.paf.smartcampus.repository.BookingRepository;
import com.it3030.paf.smartcampus.repository.FacilityResourceRepository;
import com.it3030.paf.smartcampus.repository.NotificationRepository;
import com.it3030.paf.smartcampus.repository.TicketMessageRepository;
import com.it3030.paf.smartcampus.repository.TicketingRepository;
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
  @Autowired private NotificationRepository notificationRepository;
  @Autowired private TicketMessageRepository ticketMessageRepository;
  @Autowired private TicketingRepository ticketingRepository;
  @Autowired private UserAccountRepository userAccountRepository;

  @BeforeEach
  void setUp() {
    notificationRepository.deleteAll();
    ticketMessageRepository.deleteAll();
    ticketingRepository.deleteAll();
    bookingRepository.deleteAll();
    facilityResourceRepository.deleteAll();
    userAccountRepository.deleteAll();
  }

  @Test
  @WithMockUser(username = "alice", roles = "STUDENT")
  void summary_userGetsFacilityCountAndMonth() throws Exception {
    UserAccount alice = createUser("alice", AppRole.STUDENT);
    createFacility("Building A");
    createFacility("Building B");
    FacilityResource facility = createFacility("Building C");

    createBooking(facility, alice, BookingStatus.PENDING, "2026-09-03T09:00:00Z", "2026-09-03T10:00:00Z");
    createTicket(alice, TicketStatus.OPEN);
    createTicket(alice, TicketStatus.CLOSED);

    mockMvc
        .perform(get("/api/v1/dashboard/summary"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.activeFacilitiesCount", is(3)))
        .andExpect(jsonPath("$.currentMonthLabel").isNotEmpty())
        .andExpect(jsonPath("$.pendingApprovals").isEmpty())
        .andExpect(jsonPath("$.myBookingsCount", is(1)))
        .andExpect(jsonPath("$.openTicketsCount", is(2)));
  }

  @Test
  @WithMockUser(username = "admin", roles = "ADMIN")
  void summary_adminGetsPendingApprovalCount() throws Exception {
    UserAccount admin = createUser("admin", AppRole.ADMIN);
    UserAccount alice = createUser("alice", AppRole.STUDENT);
    FacilityResource facility = createFacility("Auditorium");

    createBooking(facility, alice, BookingStatus.PENDING, "2026-09-01T09:00:00Z", "2026-09-01T10:00:00Z");
    createBooking(facility, alice, BookingStatus.PENDING, "2026-09-02T09:00:00Z", "2026-09-02T10:00:00Z");
    createBooking(facility, admin, BookingStatus.PENDING, "2026-09-03T09:00:00Z", "2026-09-03T10:00:00Z");
    createTicket(alice, TicketStatus.OPEN);
    createTicket(alice, TicketStatus.IN_PROGRESS);
    createTicket(alice, TicketStatus.CLOSED);

    mockMvc
        .perform(get("/api/v1/dashboard/summary"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.activeFacilitiesCount", greaterThan(0)))
        .andExpect(jsonPath("$.pendingApprovals", is(3)))
        .andExpect(jsonPath("$.myBookingsCount", is(1)))
        .andExpect(jsonPath("$.openTicketsCount", is(0)));
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

  private Ticketing createTicket(UserAccount student, TicketStatus status) {
    Ticketing ticket = new Ticketing();
    ticket.setStudent(student);
    ticket.setStudentName(student.getUsername());
    ticket.setCategory(TicketCategory.TECHNICAL);
    ticket.setSubject("Dashboard test ticket");
    ticket.setDescription("Ticket generated for dashboard count test");
    ticket.setStatus(status);
    ticket.setPriority(TicketPriority.MEDIUM);
    ticket.setAssignedAdmin(null);
    ticket.setClosedAt(status == TicketStatus.CLOSED ? OffsetDateTime.now() : null);
    return ticketingRepository.save(ticket);
  }
}
