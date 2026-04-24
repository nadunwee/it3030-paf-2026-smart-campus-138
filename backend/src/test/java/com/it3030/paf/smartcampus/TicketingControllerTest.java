package com.it3030.paf.smartcampus;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.it3030.paf.smartcampus.domain.TicketMessage;
import com.it3030.paf.smartcampus.domain.Ticketing;
import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.TicketCategory;
import com.it3030.paf.smartcampus.domain.enums.TicketPriority;
import com.it3030.paf.smartcampus.domain.enums.TicketSenderRole;
import com.it3030.paf.smartcampus.domain.enums.TicketStatus;
import com.it3030.paf.smartcampus.repository.BookingRepository;
import com.it3030.paf.smartcampus.repository.TicketMessageRepository;
import com.it3030.paf.smartcampus.repository.TicketingRepository;
import com.it3030.paf.smartcampus.repository.NotificationRepository;
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
public class TicketingControllerTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private UserAccountRepository userAccountRepository;
  @Autowired private BookingRepository bookingRepository;
  @Autowired private TicketingRepository ticketingRepository;
  @Autowired private TicketMessageRepository ticketMessageRepository;
  @Autowired private NotificationRepository notificationRepository;

  @BeforeEach
  void setUp() {
    notificationRepository.deleteAll();
    ticketMessageRepository.deleteAll();
    ticketingRepository.deleteAll();
    bookingRepository.deleteAll();
    userAccountRepository.deleteAll();
  }

  @Test
  void createTicket_userCreatesOpenTicketWithInitialMessage() throws Exception {
    createUser("alice", AppRole.STUDENT);

    String json =
        """
        {
          "category": "TECHNICAL",
          "subject": "WiFi not working",
          "description": "Cannot connect in lab",
          "priority": "HIGH"
        }
        """;

    mockMvc
        .perform(post("/api/v1/tickets").with(user("alice").roles("STUDENT")).contentType("application/json").content(json))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.ticket.studentName", is("alice")))
        .andExpect(jsonPath("$.ticket.status", is("OPEN")))
        .andExpect(jsonPath("$.messages", hasSize(1)))
        .andExpect(jsonPath("$.messages[0].senderRole", is("STUDENT")));
  }

  @Test
  void ticketAccess_otherStudentForbidden() throws Exception {
    UserAccount alice = createUser("alice", AppRole.STUDENT);
    createUser("bob", AppRole.STUDENT);

    Ticketing ticket = createTicket(alice, "Printer issue");

    mockMvc
        .perform(get("/api/v1/tickets/{id}", ticket.getTicketId()).with(user("bob").roles("STUDENT")))
        .andExpect(status().isForbidden());
  }

  @Test
  void adminReplyResolve_thenStudentClose_andNoReplyAfterClosed() throws Exception {
    createUser("admin", AppRole.ADMIN);
    UserAccount alice = createUser("alice", AppRole.STUDENT);

    Ticketing ticket = createTicket(alice, "Projector issue");

    String reply = """
        { "messageText": "Checking this now" }
        """;
    mockMvc
        .perform(
            post("/api/v1/tickets/{id}/messages", ticket.getTicketId())
                .with(user("admin").roles("ADMIN"))
                .contentType("application/json")
                .content(reply))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.messages[1].senderRole", is("ADMIN")));

    String resolved = """
        { "status": "RESOLVED" }
        """;
    mockMvc
        .perform(
            patch("/api/v1/tickets/{id}/status", ticket.getTicketId())
                .with(user("admin").roles("ADMIN"))
                .contentType("application/json")
                .content(resolved))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status", is("RESOLVED")));

    mockMvc
        .perform(post("/api/v1/tickets/{id}/close", ticket.getTicketId()).with(user("alice").roles("STUDENT")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status", is("CLOSED")));

    String closedReply = """
        { "messageText": "Any update?" }
        """;
    mockMvc
        .perform(
            post("/api/v1/tickets/{id}/messages", ticket.getTicketId())
                .with(user("admin").roles("ADMIN"))
                .contentType("application/json")
                .content(closedReply))
        .andExpect(status().isBadRequest());
  }

  private UserAccount createUser(String username, AppRole role) {
    UserAccount user = new UserAccount();
    user.setUsername(username);
    user.setPasswordHash("hash");
    user.setRole(role);
    return userAccountRepository.save(user);
  }

  private Ticketing createTicket(UserAccount student, String subject) {
    Ticketing ticket = new Ticketing();
    ticket.setStudent(student);
    ticket.setStudentName(student.getUsername());
    ticket.setCategory(TicketCategory.OTHER);
    ticket.setSubject(subject);
    ticket.setDescription("Need support");
    ticket.setStatus(TicketStatus.OPEN);
    ticket.setPriority(TicketPriority.MEDIUM);
    ticket.setClosedAt(null);

    Ticketing saved = ticketingRepository.save(ticket);

    TicketMessage message = new TicketMessage();
    message.setTicket(saved);
    message.setSenderId(student.getId());
    message.setSenderName(student.getUsername());
    message.setSenderRole(TicketSenderRole.STUDENT);
    message.setMessageText("Need support");
    message.setSentAt(OffsetDateTime.now());
    ticketMessageRepository.save(message);

    return saved;
  }
}
