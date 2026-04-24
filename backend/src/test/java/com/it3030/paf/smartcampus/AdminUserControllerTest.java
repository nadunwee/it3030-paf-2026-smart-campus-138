package com.it3030.paf.smartcampus;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.it3030.paf.smartcampus.domain.Booking;
import com.it3030.paf.smartcampus.domain.FacilityResource;
import com.it3030.paf.smartcampus.domain.TicketMessage;
import com.it3030.paf.smartcampus.domain.Ticketing;
import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.BookingStatus;
import com.it3030.paf.smartcampus.domain.enums.ResourceStatus;
import com.it3030.paf.smartcampus.domain.enums.ResourceType;
import com.it3030.paf.smartcampus.domain.enums.TicketCategory;
import com.it3030.paf.smartcampus.domain.enums.TicketPriority;
import com.it3030.paf.smartcampus.domain.enums.TicketSenderRole;
import com.it3030.paf.smartcampus.domain.enums.TicketStatus;
import com.it3030.paf.smartcampus.repository.BookingRepository;
import com.it3030.paf.smartcampus.repository.FacilityResourceRepository;
import com.it3030.paf.smartcampus.repository.NotificationRepository;
import com.it3030.paf.smartcampus.repository.TicketMessageRepository;
import com.it3030.paf.smartcampus.repository.TicketingRepository;
import com.it3030.paf.smartcampus.repository.UserAccountRepository;
import java.time.OffsetDateTime;
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
public class AdminUserControllerTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private UserAccountRepository userAccountRepository;
  @Autowired private NotificationRepository notificationRepository;
  @Autowired private FacilityResourceRepository facilityResourceRepository;
  @Autowired private BookingRepository bookingRepository;
  @Autowired private TicketingRepository ticketingRepository;
  @Autowired private TicketMessageRepository ticketMessageRepository;

  @BeforeEach
  void setUp() {
    notificationRepository.deleteAll();
    bookingRepository.deleteAll();
    ticketMessageRepository.deleteAll();
    ticketingRepository.deleteAll();
    facilityResourceRepository.deleteAll();
    userAccountRepository.deleteAll();
  }

  @Test
  void adminCanListUsersAndUpdateRoleToTeacher() throws Exception {
    UserAccount admin = createUser("admin", AppRole.ADMIN);
    UserAccount student = createUser("alice", AppRole.STUDENT);

    mockMvc
        .perform(get("/api/v1/admin/users").with(user(admin.getUsername()).roles("ADMIN")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()", is(2)));

    mockMvc
        .perform(
            patch("/api/v1/admin/users/{id}/role", student.getId())
                .with(user(admin.getUsername()).roles("ADMIN"))
                .contentType("application/json")
                .content("{\"role\":\"TEACHER\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id", is(student.getId().intValue())))
        .andExpect(jsonPath("$.role", is("TEACHER")));
  }

  @Test
  void studentCannotAccessAdminUserManagementEndpoints() throws Exception {
    createUser("admin", AppRole.ADMIN);
    UserAccount student = createUser("alice", AppRole.STUDENT);

    mockMvc
        .perform(get("/api/v1/admin/users").with(user(student.getUsername()).roles("STUDENT")))
        .andExpect(status().isForbidden());

    mockMvc
        .perform(
            patch("/api/v1/admin/users/{id}/role", student.getId())
                .with(user(student.getUsername()).roles("STUDENT"))
                .contentType("application/json")
                .content("{\"role\":\"TEACHER\"}"))
        .andExpect(status().isForbidden());

    mockMvc
        .perform(
            post("/api/v1/admin/users")
                .with(user(student.getUsername()).roles("STUDENT"))
                .contentType("application/json")
                .content("{\"username\":\"bob\",\"password\":\"password123\",\"role\":\"STUDENT\"}"))
        .andExpect(status().isForbidden());

    mockMvc
        .perform(delete("/api/v1/admin/users/{id}", student.getId()).with(user(student.getUsername()).roles("STUDENT")))
        .andExpect(status().isForbidden());
  }

  @Test
  void adminCannotAssignAdminRoleThroughRoleUpdate() throws Exception {
    UserAccount admin = createUser("admin", AppRole.ADMIN);
    UserAccount student = createUser("alice", AppRole.STUDENT);

    mockMvc
        .perform(
            patch("/api/v1/admin/users/{id}/role", student.getId())
                .with(user(admin.getUsername()).roles("ADMIN"))
                .contentType("application/json")
                .content("{\"role\":\"ADMIN\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void adminCanCreateAndDeleteNonAdminUser() throws Exception {
    UserAccount admin = createUser("admin", AppRole.ADMIN);

    mockMvc
        .perform(
            post("/api/v1/admin/users")
                .with(user(admin.getUsername()).roles("ADMIN"))
                .contentType("application/json")
                .content("{\"username\":\"newuser\",\"password\":\"password123\",\"role\":\"TEACHER\"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.username", is("newuser")))
        .andExpect(jsonPath("$.role", is("TEACHER")));

    UserAccount created = userAccountRepository.findByUsername("newuser").orElseThrow();

    mockMvc
        .perform(delete("/api/v1/admin/users/{id}", created.getId()).with(user(admin.getUsername()).roles("ADMIN")))
        .andExpect(status().isNoContent());

    org.junit.jupiter.api.Assertions.assertTrue(userAccountRepository.findByUsername("newuser").isEmpty());
  }

  @Test
  void adminCannotDeleteAdminUser() throws Exception {
    UserAccount admin = createUser("admin", AppRole.ADMIN);
    UserAccount secondAdmin = createUser("admin2", AppRole.ADMIN);

    mockMvc
        .perform(delete("/api/v1/admin/users/{id}", secondAdmin.getId()).with(user(admin.getUsername()).roles("ADMIN")))
        .andExpect(status().isBadRequest());
  }

  @Test
  void adminDeleteAlsoRemovesStudentBookingsAndTickets() throws Exception {
    UserAccount admin = createUser("admin", AppRole.ADMIN);
    UserAccount student = createUser("student1", AppRole.STUDENT);
    UserAccount adminResponder = createUser("admin-responder", AppRole.ADMIN);

    FacilityResource facility = createFacility("Library");
    createBooking(facility, student);
    Ticketing ticket = createTicket(student);
    createTicketMessage(ticket, student);
    createTicketMessage(ticket, adminResponder);

    mockMvc
        .perform(delete("/api/v1/admin/users/{id}", student.getId()).with(user(admin.getUsername()).roles("ADMIN")))
        .andExpect(status().isNoContent());

    org.junit.jupiter.api.Assertions.assertTrue(userAccountRepository.findById(student.getId()).isEmpty());
    org.junit.jupiter.api.Assertions.assertEquals(0L, bookingRepository.countByBookedByUserId(student.getId()));
    org.junit.jupiter.api.Assertions.assertEquals(0L, ticketingRepository.countByStudentId(student.getId()));
    org.junit.jupiter.api.Assertions.assertEquals(0L, ticketMessageRepository.count());
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
    facility.setType(ResourceType.LAB);
    facility.setCapacity(30);
    facility.setLocation(location);
    facility.setStatus(ResourceStatus.ACTIVE);
    facility.setDeleted(false);
    return facilityResourceRepository.save(facility);
  }

  private Booking createBooking(FacilityResource facility, UserAccount user) {
    Booking booking = new Booking();
    booking.setFacilityResource(facility);
    booking.setBookedByUser(user);
    booking.setBookedByUserName(user.getUsername());
    booking.setFacilityName(facility.getType().name() + " - " + facility.getLocation());
    booking.setPurpose("Deletion test booking");
    booking.setDurationMinutes(60);
    booking.setBookedFrom(OffsetDateTime.parse("2026-09-01T09:00:00Z"));
    booking.setBookedTo(OffsetDateTime.parse("2026-09-01T10:00:00Z"));
    booking.setStatus(BookingStatus.PENDING);
    return bookingRepository.save(booking);
  }

  private Ticketing createTicket(UserAccount student) {
    Ticketing ticket = new Ticketing();
    ticket.setStudent(student);
    ticket.setStudentName(student.getUsername());
    ticket.setCategory(TicketCategory.TECHNICAL);
    ticket.setSubject("Deletion test ticket");
    ticket.setDescription("Deletion test description");
    ticket.setStatus(TicketStatus.OPEN);
    ticket.setPriority(TicketPriority.MEDIUM);
    return ticketingRepository.save(ticket);
  }

  private TicketMessage createTicketMessage(Ticketing ticket, UserAccount sender) {
    TicketMessage message = new TicketMessage();
    message.setTicket(ticket);
    message.setSenderId(sender.getId());
    message.setSenderName(sender.getUsername());
    message.setSenderRole(sender.getRole() == AppRole.ADMIN ? TicketSenderRole.ADMIN : TicketSenderRole.STUDENT);
    message.setMessageText("Deletion test message");
    return ticketMessageRepository.save(message);
  }
}
