package com.it3030.paf.smartcampus.service;

import com.it3030.paf.smartcampus.api.dto.TicketCreateRequest;
import com.it3030.paf.smartcampus.api.dto.TicketDetailResponse;
import com.it3030.paf.smartcampus.api.dto.TicketMessageResponse;
import com.it3030.paf.smartcampus.api.dto.TicketReplyRequest;
import com.it3030.paf.smartcampus.api.dto.TicketResponse;
import com.it3030.paf.smartcampus.domain.TicketMessage;
import com.it3030.paf.smartcampus.domain.Ticketing;
import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.TicketCategory;
import com.it3030.paf.smartcampus.domain.enums.TicketPriority;
import com.it3030.paf.smartcampus.domain.enums.TicketSenderRole;
import com.it3030.paf.smartcampus.domain.enums.TicketStatus;
import com.it3030.paf.smartcampus.domain.enums.NotificationType;
import com.it3030.paf.smartcampus.domain.enums.RelatedEntityType;
import com.it3030.paf.smartcampus.exception.ResourceNotFoundException;
import com.it3030.paf.smartcampus.repository.TicketMessageRepository;
import com.it3030.paf.smartcampus.repository.TicketingRepository;
import com.it3030.paf.smartcampus.repository.TicketingSpecifications;
import com.it3030.paf.smartcampus.repository.UserAccountRepository;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TicketingService {

  private final TicketingRepository ticketingRepository;
  private final TicketMessageRepository ticketMessageRepository;
  private final UserAccountRepository userAccountRepository;
  private final NotificationService notificationService;

  public TicketingService(
      TicketingRepository ticketingRepository,
      TicketMessageRepository ticketMessageRepository,
      UserAccountRepository userAccountRepository,
      NotificationService notificationService) {
    this.ticketingRepository = ticketingRepository;
    this.ticketMessageRepository = ticketMessageRepository;
    this.userAccountRepository = userAccountRepository;
    this.notificationService = notificationService;
  }

  @Transactional
  public TicketDetailResponse createTicket(TicketCreateRequest request, String username) {
    UserAccount student = getRequiredUser(username);
    if (student.getRole() != AppRole.STUDENT) {
      throw new AccessDeniedException("Only students can create tickets");
    }

    Ticketing ticket = new Ticketing();
    ticket.setStudent(student);
    ticket.setStudentName(student.getUsername());
    ticket.setCategory(request.getCategory());
    ticket.setSubject(request.getSubject().trim());
    ticket.setDescription(request.getDescription().trim());
    ticket.setStatus(TicketStatus.OPEN);
    ticket.setPriority(request.getPriority() == null ? TicketPriority.MEDIUM : request.getPriority());
    ticket.setClosedAt(null);
    ticket.setAssignedAdmin(null);

    Ticketing savedTicket = ticketingRepository.save(ticket);

    TicketMessage initialMessage = new TicketMessage();
    initialMessage.setTicket(savedTicket);
    initialMessage.setSenderId(student.getId());
    initialMessage.setSenderName(student.getUsername());
    initialMessage.setSenderRole(TicketSenderRole.STUDENT);
    initialMessage.setMessageText(request.getDescription().trim());
    ticketMessageRepository.save(initialMessage);

    notificationService.notifyAdmins(
        NotificationType.TICKET_CREATED,
        "New maintenance ticket",
        student.getUsername() + " created ticket #" + savedTicket.getTicketId() + ": " + savedTicket.getSubject(),
        RelatedEntityType.TICKET,
        savedTicket.getTicketId(),
        "/tickets",
        student);

    return toDetailResponse(savedTicket, List.of(initialMessage));
  }

  @Transactional(readOnly = true)
  public Page<TicketResponse> listMyTickets(String username, Pageable pageable) {
    UserAccount student = getRequiredUser(username);
    return ticketingRepository.findByStudentIdOrderByUpdatedAtDesc(student.getId(), pageable).map(this::toTicketResponse);
  }

  @Transactional(readOnly = true)
  public Page<TicketResponse> listAllTickets(
      TicketStatus status,
      TicketCategory category,
      TicketPriority priority,
      Pageable pageable) {
    Specification<Ticketing> spec =
        Specification.where(TicketingSpecifications.statusEquals(status))
            .and(TicketingSpecifications.categoryEquals(category))
            .and(TicketingSpecifications.priorityEquals(priority));

    return ticketingRepository.findAll(spec, pageable).map(this::toTicketResponse);
  }

  @Transactional(readOnly = true)
  public TicketDetailResponse getTicketWithMessages(Long ticketId, String username, boolean isAdmin) {
    UserAccount actor = getRequiredUser(username);
    Ticketing ticket = getAccessibleTicket(ticketId, actor, isAdmin);
    List<TicketMessage> messages = ticketMessageRepository.findByTicketTicketIdOrderBySentAtAsc(ticketId);
    return toDetailResponse(ticket, messages);
  }

  @Transactional
  public TicketDetailResponse replyToTicket(
      Long ticketId,
      TicketReplyRequest request,
      String username,
      boolean isAdmin) {
    UserAccount actor = getRequiredUser(username);
    Ticketing ticket = getAccessibleTicket(ticketId, actor, isAdmin);

    if (ticket.getStatus() == TicketStatus.CLOSED) {
      throw new IllegalArgumentException("Cannot reply to a closed ticket. Reopen it first.");
    }

    TicketMessage message = new TicketMessage();
    message.setTicket(ticket);
    message.setSenderId(actor.getId());
    message.setSenderName(actor.getUsername());
    message.setSenderRole(isAdmin ? TicketSenderRole.ADMIN : TicketSenderRole.STUDENT);
    message.setMessageText(request.getMessageText().trim());

    if (isAdmin && ticket.getAssignedAdmin() == null) {
      ticket.setAssignedAdmin(actor);
    }
    if (isAdmin && ticket.getStatus() == TicketStatus.OPEN) {
      ticket.setStatus(TicketStatus.IN_PROGRESS);
    }

    ticket.setUpdatedAt(OffsetDateTime.now());
    Ticketing savedTicket = ticketingRepository.save(ticket);
    ticketMessageRepository.save(message);

    if (isAdmin) {
      notificationService.notifyUser(
          savedTicket.getStudent(),
          NotificationType.TICKET_ADMIN_REPLY,
          "Admin replied to your ticket",
          "You have a new admin reply on ticket #" + savedTicket.getTicketId() + ".",
          RelatedEntityType.TICKET,
          savedTicket.getTicketId(),
          "/tickets",
          actor);
    } else {
      notifyTicketAdmins(
          savedTicket,
          NotificationType.TICKET_STUDENT_REPLY,
          "Student replied to ticket",
          actor.getUsername() + " replied on ticket #" + savedTicket.getTicketId() + ".",
          actor);
    }

    List<TicketMessage> messages = ticketMessageRepository.findByTicketTicketIdOrderBySentAtAsc(ticketId);
    return toDetailResponse(savedTicket, messages);
  }

  @Transactional
  public TicketResponse updateTicketStatus(Long ticketId, TicketStatus newStatus, String adminUsername) {
    if (newStatus == TicketStatus.CLOSED) {
      throw new IllegalArgumentException("Students close tickets. Admin can set OPEN, IN_PROGRESS, or RESOLVED.");
    }

    UserAccount admin = getRequiredUser(adminUsername);
    if (admin.getRole() != AppRole.ADMIN) {
      throw new AccessDeniedException("Only admin can update ticket status");
    }

    Ticketing ticket =
        ticketingRepository.findById(ticketId).orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

    TicketStatus previousStatus = ticket.getStatus();
    ticket.setStatus(newStatus);
    ticket.setClosedAt(null);
    if (ticket.getAssignedAdmin() == null) {
      ticket.setAssignedAdmin(admin);
    }
    ticket.setUpdatedAt(OffsetDateTime.now());

    Ticketing saved = ticketingRepository.save(ticket);

    if (previousStatus != TicketStatus.RESOLVED && newStatus == TicketStatus.RESOLVED) {
      notificationService.notifyUser(
          saved.getStudent(),
          NotificationType.TICKET_RESOLVED,
          "Ticket resolved",
          "Your ticket #" + saved.getTicketId() + " has been marked as RESOLVED.",
          RelatedEntityType.TICKET,
          saved.getTicketId(),
          "/tickets",
          admin);
    }

    return toTicketResponse(saved);
  }

  @Transactional
  public TicketResponse closeTicket(Long ticketId, String username) {
    UserAccount student = getRequiredUser(username);

    Ticketing ticket =
        ticketingRepository.findById(ticketId).orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

    if (!ticket.getStudent().getId().equals(student.getId())) {
      throw new AccessDeniedException("You do not have access to this ticket");
    }

    if (ticket.getStatus() != TicketStatus.RESOLVED) {
      throw new IllegalArgumentException("Only RESOLVED tickets can be closed by students");
    }

    ticket.setStatus(TicketStatus.CLOSED);
    ticket.setClosedAt(OffsetDateTime.now());
    ticket.setUpdatedAt(OffsetDateTime.now());

    Ticketing saved = ticketingRepository.save(ticket);
    notifyTicketAdmins(
        saved,
        NotificationType.TICKET_CLOSED,
        "Ticket closed",
        student.getUsername() + " closed ticket #" + saved.getTicketId() + ".",
        student);

    return toTicketResponse(saved);
  }

  @Transactional(readOnly = true)
  public long countOpenTickets() {
    return ticketingRepository.countByStatus(TicketStatus.OPEN);
  }

  private Ticketing getAccessibleTicket(Long ticketId, UserAccount actor, boolean isAdmin) {
    Ticketing ticket =
        ticketingRepository.findById(ticketId).orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

    if (!isAdmin && !ticket.getStudent().getId().equals(actor.getId())) {
      throw new AccessDeniedException("You do not have access to this ticket");
    }
    return ticket;
  }

  private UserAccount getRequiredUser(String username) {
    return userAccountRepository
        .findByUsername(username)
        .orElseThrow(() -> new ResourceNotFoundException("User account not found"));
  }

  private void notifyTicketAdmins(
      Ticketing ticket,
      NotificationType type,
      String title,
      String message,
      UserAccount sender) {
    if (ticket.getAssignedAdmin() != null) {
      notificationService.notifyUser(
          ticket.getAssignedAdmin(),
          type,
          title,
          message,
          RelatedEntityType.TICKET,
          ticket.getTicketId(),
          "/tickets",
          sender);
      return;
    }

    notificationService.notifyAdmins(
        type,
        title,
        message,
        RelatedEntityType.TICKET,
        ticket.getTicketId(),
        "/tickets",
        sender);
  }

  private TicketDetailResponse toDetailResponse(Ticketing ticket, List<TicketMessage> messages) {
    TicketDetailResponse response = new TicketDetailResponse();
    response.setTicket(toTicketResponse(ticket));
    response.setMessages(messages.stream().map(this::toMessageResponse).toList());
    return response;
  }

  private TicketResponse toTicketResponse(Ticketing ticket) {
    TicketResponse response = new TicketResponse();
    response.setTicketId(ticket.getTicketId());
    response.setStudentId(ticket.getStudent().getId());
    response.setStudentName(ticket.getStudentName());
    response.setCategory(ticket.getCategory());
    response.setSubject(ticket.getSubject());
    response.setDescription(ticket.getDescription());
    response.setStatus(ticket.getStatus());
    response.setPriority(ticket.getPriority());
    response.setCreatedAt(ticket.getCreatedAt());
    response.setUpdatedAt(ticket.getUpdatedAt());
    response.setClosedAt(ticket.getClosedAt());
    response.setAssignedAdminId(ticket.getAssignedAdmin() == null ? null : ticket.getAssignedAdmin().getId());
    return response;
  }

  private TicketMessageResponse toMessageResponse(TicketMessage message) {
    TicketMessageResponse response = new TicketMessageResponse();
    response.setMessageId(message.getMessageId());
    response.setSenderId(message.getSenderId());
    response.setSenderRole(message.getSenderRole());
    response.setSenderName(message.getSenderName());
    response.setMessageContent(message.getMessageText());
    response.setSentAt(message.getSentAt());
    return response;
  }
}
