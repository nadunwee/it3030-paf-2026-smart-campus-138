package com.it3030.paf.smartcampus.service;

import com.it3030.paf.smartcampus.api.dto.TicketAttachmentRequest;
import com.it3030.paf.smartcampus.api.dto.TicketAttachmentResponse;
import com.it3030.paf.smartcampus.api.dto.TicketCreateRequest;
import com.it3030.paf.smartcampus.api.dto.TicketDetailResponse;
import com.it3030.paf.smartcampus.api.dto.TicketMessageResponse;
import com.it3030.paf.smartcampus.api.dto.TicketMessageUpdateRequest;
import com.it3030.paf.smartcampus.api.dto.TicketReplyRequest;
import com.it3030.paf.smartcampus.api.dto.TicketResponse;
import com.it3030.paf.smartcampus.domain.FacilityResource;
import com.it3030.paf.smartcampus.domain.TicketAttachment;
import com.it3030.paf.smartcampus.domain.TicketMessage;
import com.it3030.paf.smartcampus.domain.Ticketing;
import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.NotificationType;
import com.it3030.paf.smartcampus.domain.enums.RelatedEntityType;
import com.it3030.paf.smartcampus.domain.enums.TicketCategory;
import com.it3030.paf.smartcampus.domain.enums.TicketPriority;
import com.it3030.paf.smartcampus.domain.enums.TicketSenderRole;
import com.it3030.paf.smartcampus.domain.enums.TicketStatus;
import com.it3030.paf.smartcampus.exception.ResourceNotFoundException;
import com.it3030.paf.smartcampus.repository.FacilityResourceRepository;
import com.it3030.paf.smartcampus.repository.TicketAttachmentRepository;
import com.it3030.paf.smartcampus.repository.TicketMessageRepository;
import com.it3030.paf.smartcampus.repository.TicketingRepository;
import com.it3030.paf.smartcampus.repository.TicketingSpecifications;
import com.it3030.paf.smartcampus.repository.UserAccountRepository;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TicketingService {

  private static final int MAX_ATTACHMENTS = 3;
  private static final String IMAGE_DATA_URL_PREFIX = "data:image/";

  private final TicketingRepository ticketingRepository;
  private final TicketAttachmentRepository ticketAttachmentRepository;
  private final TicketMessageRepository ticketMessageRepository;
  private final UserAccountRepository userAccountRepository;
  private final FacilityResourceRepository facilityResourceRepository;
  private final NotificationService notificationService;

  public TicketingService(
      TicketingRepository ticketingRepository,
      TicketAttachmentRepository ticketAttachmentRepository,
      TicketMessageRepository ticketMessageRepository,
      UserAccountRepository userAccountRepository,
      FacilityResourceRepository facilityResourceRepository,
      NotificationService notificationService) {
    this.ticketingRepository = ticketingRepository;
    this.ticketAttachmentRepository = ticketAttachmentRepository;
    this.ticketMessageRepository = ticketMessageRepository;
    this.userAccountRepository = userAccountRepository;
    this.facilityResourceRepository = facilityResourceRepository;
    this.notificationService = notificationService;
  }

  @Transactional
  public TicketDetailResponse createTicket(TicketCreateRequest request, String username) {
    UserAccount requester = getRequiredUser(username);
    if (requester.getRole() == AppRole.ADMIN) {
      throw new AccessDeniedException("Only non-admin users can create tickets");
    }

    FacilityResource resource = null;
    if (request.getResourceId() != null) {
      resource =
          facilityResourceRepository
              .findById(request.getResourceId())
              .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));
      if (resource.isDeleted()) {
        throw new ResourceNotFoundException("Resource not found");
      }
    }

    String location = normalizeOptional(request.getLocation());
    if (location == null && resource != null) {
      location = resource.getLocation();
    }
    if (location == null) {
      throw new IllegalArgumentException("resourceId or location is required");
    }

    Ticketing ticket = new Ticketing();
    ticket.setStudent(requester);
    ticket.setStudentName(requester.getUsername());
    ticket.setCategory(request.getCategory());
    ticket.setSubject(request.getSubject().trim());
    ticket.setDescription(request.getDescription().trim());
    ticket.setResource(resource);
    ticket.setLocation(location);
    ticket.setPreferredContactDetails(request.getPreferredContactDetails().trim());
    ticket.setStatus(TicketStatus.OPEN);
    ticket.setPriority(request.getPriority() == null ? TicketPriority.MEDIUM : request.getPriority());
    ticket.setClosedAt(null);
    ticket.setAssignedAdmin(null);
    ticket.setResolutionNotes(null);
    ticket.setRejectionReason(null);

    List<TicketAttachment> attachments = toAttachments(request.getAttachments());

    Ticketing savedTicket = ticketingRepository.save(ticket);

    attachments.forEach(attachment -> attachment.setTicket(savedTicket));
    List<TicketAttachment> savedAttachments = ticketAttachmentRepository.saveAll(attachments);
    savedTicket.setAttachments(new ArrayList<>(savedAttachments));

    TicketMessage initialMessage = new TicketMessage();
    initialMessage.setTicket(savedTicket);
    initialMessage.setSenderId(requester.getId());
    initialMessage.setSenderName(requester.getUsername());
    initialMessage.setSenderRole(TicketSenderRole.STUDENT);
    initialMessage.setMessageText(request.getDescription().trim());
    ticketMessageRepository.save(initialMessage);

    notificationService.notifyAdmins(
        NotificationType.TICKET_CREATED,
        "New incident ticket",
        requester.getUsername() + " created ticket #" + savedTicket.getTicketId() + ": " + savedTicket.getSubject(),
        RelatedEntityType.TICKET,
        savedTicket.getTicketId(),
        "/tickets",
        requester);

    return toDetailResponse(savedTicket, List.of(initialMessage));
  }

  @Transactional(readOnly = true)
  public Page<TicketResponse> listMyTickets(String username, Pageable pageable) {
    UserAccount student = getRequiredUser(username);
    return ticketingRepository.findByStudentIdOrderByUpdatedAtDesc(student.getId(), pageable).map(this::toTicketResponse);
  }

  @Transactional(readOnly = true)
  public Page<TicketResponse> listVisibleStaffTickets(
      TicketStatus status,
      TicketCategory category,
      TicketPriority priority,
      String username,
      Pageable pageable) {
    UserAccount actor = getRequiredUser(username);
    if (!isTicketStaff(actor)) {
      throw new AccessDeniedException("Only staff can view assigned tickets");
    }

    Specification<Ticketing> spec =
        Specification.where(TicketingSpecifications.statusEquals(status))
            .and(TicketingSpecifications.categoryEquals(category))
            .and(TicketingSpecifications.priorityEquals(priority));

    if (actor.getRole() != AppRole.ADMIN) {
      spec = spec.and(TicketingSpecifications.assignedTo(actor.getId()));
    }

    return ticketingRepository.findAll(spec, pageable).map(this::toTicketResponse);
  }

  @Transactional(readOnly = true)
  public TicketDetailResponse getTicketWithMessages(Long ticketId, String username, boolean isAdmin) {
    UserAccount actor = getRequiredUser(username);
    Ticketing ticket = getAccessibleTicket(ticketId, actor);
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
    Ticketing ticket = getAccessibleTicket(ticketId, actor);

    if (isTerminal(ticket.getStatus())) {
      throw new IllegalArgumentException("Cannot reply to a closed or rejected ticket.");
    }

    TicketMessage message = new TicketMessage();
    message.setTicket(ticket);
    message.setSenderId(actor.getId());
    message.setSenderName(actor.getUsername());
    message.setSenderRole(toSenderRole(actor, ticket));
    message.setMessageText(request.getMessageText().trim());

    boolean handlerReply = isTicketHandler(actor, ticket);
    if (handlerReply && ticket.getAssignedAdmin() == null) {
      ticket.setAssignedAdmin(actor);
    }
    if (handlerReply && ticket.getStatus() == TicketStatus.OPEN) {
      ticket.setStatus(TicketStatus.IN_PROGRESS);
    }

    ticket.setUpdatedAt(OffsetDateTime.now());
    Ticketing savedTicket = ticketingRepository.save(ticket);
    ticketMessageRepository.save(message);

    if (handlerReply) {
      notificationService.notifyUser(
          savedTicket.getStudent(),
          NotificationType.TICKET_ADMIN_REPLY,
          "Staff replied to your ticket",
          "You have a new staff reply on ticket #" + savedTicket.getTicketId() + ".",
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
  public TicketResponse updateTicketStatus(
      Long ticketId,
      TicketStatus newStatus,
      String resolutionNotes,
      String reason,
      String username) {
    if (newStatus == TicketStatus.CLOSED) {
      throw new IllegalArgumentException("Requesters close tickets. Staff can set OPEN, IN_PROGRESS, RESOLVED, or REJECTED.");
    }

    UserAccount actor = getRequiredUser(username);
    if (!isTicketStaff(actor)) {
      throw new AccessDeniedException("Only staff can update ticket status");
    }

    Ticketing ticket =
        ticketingRepository.findById(ticketId).orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

    if (actor.getRole() != AppRole.ADMIN && !isAssignedToActor(ticket, actor)) {
      throw new AccessDeniedException("Only the assigned staff member can update this ticket");
    }

    if (newStatus == TicketStatus.REJECTED && actor.getRole() != AppRole.ADMIN) {
      throw new AccessDeniedException("Only admin can reject a ticket");
    }

    String normalizedReason = normalizeOptional(reason);
    if (newStatus == TicketStatus.REJECTED && normalizedReason == null) {
      throw new IllegalArgumentException("reason is required when rejecting a ticket");
    }

    TicketStatus previousStatus = ticket.getStatus();
    validateStatusChange(previousStatus, newStatus, actor);

    ticket.setStatus(newStatus);
    ticket.setClosedAt(null);
    if (newStatus == TicketStatus.REJECTED) {
      ticket.setRejectionReason(normalizedReason);
    } else {
      ticket.setRejectionReason(null);
    }
    String normalizedResolutionNotes = normalizeOptional(resolutionNotes);
    if (newStatus == TicketStatus.RESOLVED && normalizedResolutionNotes != null) {
      ticket.setResolutionNotes(normalizedResolutionNotes);
    }
    if (ticket.getAssignedAdmin() == null) {
      ticket.setAssignedAdmin(actor);
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
          actor);
    }

    if (previousStatus != TicketStatus.REJECTED && newStatus == TicketStatus.REJECTED) {
      notificationService.notifyUser(
          saved.getStudent(),
          NotificationType.TICKET_REJECTED,
          "Ticket rejected",
          "Your ticket #" + saved.getTicketId() + " has been rejected.",
          RelatedEntityType.TICKET,
          saved.getTicketId(),
          "/tickets",
          actor);
    }

    return toTicketResponse(saved);
  }

  @Transactional
  public TicketResponse assignTicket(Long ticketId, Long assignedStaffId, String adminUsername) {
    UserAccount admin = getRequiredUser(adminUsername);
    if (admin.getRole() != AppRole.ADMIN) {
      throw new AccessDeniedException("Only admin can assign tickets");
    }

    Ticketing ticket =
        ticketingRepository.findById(ticketId).orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

    UserAccount assignedStaff = null;
    if (assignedStaffId != null) {
      assignedStaff =
          userAccountRepository
              .findById(assignedStaffId)
              .orElseThrow(() -> new ResourceNotFoundException("Staff user not found"));
      if (!isTicketStaff(assignedStaff)) {
        throw new IllegalArgumentException("Tickets can only be assigned to admin or teacher staff");
      }
    }

    ticket.setAssignedAdmin(assignedStaff);
    ticket.setUpdatedAt(OffsetDateTime.now());
    Ticketing saved = ticketingRepository.save(ticket);

    if (assignedStaff != null) {
      notificationService.notifyUser(
          assignedStaff,
          NotificationType.TICKET_ASSIGNED,
          "Ticket assigned",
          "Ticket #" + saved.getTicketId() + " has been assigned to you.",
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
      throw new IllegalArgumentException("Only RESOLVED tickets can be closed by the requester");
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

  @Transactional
  public TicketDetailResponse updateMessage(
      Long ticketId,
      Long messageId,
      TicketMessageUpdateRequest request,
      String username) {
    UserAccount actor = getRequiredUser(username);
    Ticketing ticket = getAccessibleTicket(ticketId, actor);
    TicketMessage message = getTicketMessage(ticketId, messageId);

    if (!message.getSenderId().equals(actor.getId())) {
      throw new AccessDeniedException("Only the comment owner can edit this comment");
    }
    if (isTerminal(ticket.getStatus()) && actor.getRole() != AppRole.ADMIN) {
      throw new IllegalArgumentException("Cannot edit comments on a closed or rejected ticket");
    }

    message.setMessageText(request.getMessageText().trim());
    message.setEditedAt(OffsetDateTime.now());
    ticketMessageRepository.save(message);
    ticket.setUpdatedAt(OffsetDateTime.now());
    Ticketing savedTicket = ticketingRepository.save(ticket);

    List<TicketMessage> messages = ticketMessageRepository.findByTicketTicketIdOrderBySentAtAsc(ticketId);
    return toDetailResponse(savedTicket, messages);
  }

  @Transactional
  public TicketDetailResponse deleteMessage(Long ticketId, Long messageId, String username) {
    UserAccount actor = getRequiredUser(username);
    Ticketing ticket = getAccessibleTicket(ticketId, actor);
    TicketMessage message = getTicketMessage(ticketId, messageId);

    boolean ownsMessage = message.getSenderId().equals(actor.getId());
    if (!ownsMessage && actor.getRole() != AppRole.ADMIN) {
      throw new AccessDeniedException("Only the comment owner or admin can delete this comment");
    }
    if (isTerminal(ticket.getStatus()) && actor.getRole() != AppRole.ADMIN) {
      throw new IllegalArgumentException("Cannot delete comments on a closed or rejected ticket");
    }

    ticketMessageRepository.delete(message);
    ticket.setUpdatedAt(OffsetDateTime.now());
    Ticketing savedTicket = ticketingRepository.save(ticket);

    List<TicketMessage> messages = ticketMessageRepository.findByTicketTicketIdOrderBySentAtAsc(ticketId);
    return toDetailResponse(savedTicket, messages);
  }

  @Transactional(readOnly = true)
  public long countOpenTickets() {
    return ticketingRepository.countByStatus(TicketStatus.OPEN);
  }

  private Ticketing getAccessibleTicket(Long ticketId, UserAccount actor) {
    Ticketing ticket =
        ticketingRepository.findById(ticketId).orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

    boolean isOwner = ticket.getStudent().getId().equals(actor.getId());
    if (actor.getRole() != AppRole.ADMIN && !isOwner && !isAssignedToActor(ticket, actor)) {
      throw new AccessDeniedException("You do not have access to this ticket");
    }
    return ticket;
  }

  private TicketMessage getTicketMessage(Long ticketId, Long messageId) {
    TicketMessage message =
        ticketMessageRepository
            .findById(messageId)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket comment not found"));
    if (!message.getTicket().getTicketId().equals(ticketId)) {
      throw new ResourceNotFoundException("Ticket comment not found");
    }
    return message;
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

  private List<TicketAttachment> toAttachments(List<TicketAttachmentRequest> requests) {
    if (requests == null || requests.isEmpty()) {
      return new ArrayList<>();
    }
    if (requests.size() > MAX_ATTACHMENTS) {
      throw new IllegalArgumentException("Tickets can include up to 3 image attachments");
    }

    return new ArrayList<>(
        requests.stream()
        .map(
            request -> {
              String contentType = request.getContentType().trim().toLowerCase();
              String dataUrl = request.getDataUrl().trim();
              if (!contentType.startsWith("image/") || !dataUrl.toLowerCase().startsWith(IMAGE_DATA_URL_PREFIX)) {
                throw new IllegalArgumentException("Ticket attachments must be images");
              }
              if (!dataUrl.contains(";base64,")) {
                throw new IllegalArgumentException("Ticket attachments must be base64 data URLs");
              }

              TicketAttachment attachment = new TicketAttachment();
              attachment.setFileName(request.getFileName().trim());
              attachment.setContentType(contentType);
              attachment.setDataUrl(dataUrl);
              return attachment;
            })
        .toList());
  }

  private boolean isTicketStaff(UserAccount user) {
    return user.getRole() == AppRole.ADMIN || user.getRole() == AppRole.TEACHER;
  }

  private boolean isTicketHandler(UserAccount actor, Ticketing ticket) {
    return actor.getRole() == AppRole.ADMIN || isAssignedToActor(ticket, actor);
  }

  private boolean isAssignedToActor(Ticketing ticket, UserAccount actor) {
    return ticket.getAssignedAdmin() != null && ticket.getAssignedAdmin().getId().equals(actor.getId());
  }

  private boolean isTerminal(TicketStatus status) {
    return status == TicketStatus.CLOSED || status == TicketStatus.REJECTED;
  }

  private TicketSenderRole toSenderRole(UserAccount actor, Ticketing ticket) {
    if (actor.getRole() == AppRole.ADMIN) {
      return TicketSenderRole.ADMIN;
    }
    if (isAssignedToActor(ticket, actor)) {
      return TicketSenderRole.STAFF;
    }
    return TicketSenderRole.STUDENT;
  }

  private void validateStatusChange(TicketStatus previousStatus, TicketStatus newStatus, UserAccount actor) {
    if (previousStatus == newStatus) {
      return;
    }
    if (actor.getRole() == AppRole.ADMIN) {
      return;
    }
    if (previousStatus == TicketStatus.OPEN && newStatus == TicketStatus.IN_PROGRESS) {
      return;
    }
    if (previousStatus == TicketStatus.IN_PROGRESS && newStatus == TicketStatus.RESOLVED) {
      return;
    }
    throw new IllegalArgumentException("Assigned staff can only move tickets OPEN -> IN_PROGRESS -> RESOLVED");
  }

  private String normalizeOptional(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private TicketDetailResponse toDetailResponse(Ticketing ticket, List<TicketMessage> messages) {
    List<TicketAttachment> attachments =
        ticketAttachmentRepository.findByTicketTicketIdOrderByUploadedAtAsc(ticket.getTicketId());
    TicketDetailResponse response = new TicketDetailResponse();
    response.setTicket(toTicketResponse(ticket));
    response.setMessages(messages.stream().map(this::toMessageResponse).toList());
    response.setAttachments(attachments.stream().map(this::toAttachmentResponse).toList());
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
    if (ticket.getResource() != null) {
      response.setResourceId(ticket.getResource().getId());
      response.setResourceLabel(ticket.getResource().getType() + " - " + ticket.getResource().getLocation());
    }
    response.setLocation(ticket.getLocation());
    response.setPreferredContactDetails(ticket.getPreferredContactDetails());
    response.setStatus(ticket.getStatus());
    response.setPriority(ticket.getPriority());
    response.setCreatedAt(ticket.getCreatedAt());
    response.setUpdatedAt(ticket.getUpdatedAt());
    response.setClosedAt(ticket.getClosedAt());
    response.setResolutionNotes(ticket.getResolutionNotes());
    response.setRejectionReason(ticket.getRejectionReason());
    Long assignedStaffId = ticket.getAssignedAdmin() == null ? null : ticket.getAssignedAdmin().getId();
    response.setAssignedAdminId(assignedStaffId);
    response.setAssignedStaffId(assignedStaffId);
    response.setAssignedStaffName(ticket.getAssignedAdmin() == null ? null : ticket.getAssignedAdmin().getUsername());
    response.setAttachmentCount(Math.toIntExact(ticketAttachmentRepository.countByTicketTicketId(ticket.getTicketId())));
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
    response.setEditedAt(message.getEditedAt());
    return response;
  }

  private TicketAttachmentResponse toAttachmentResponse(TicketAttachment attachment) {
    TicketAttachmentResponse response = new TicketAttachmentResponse();
    response.setAttachmentId(attachment.getAttachmentId());
    response.setFileName(attachment.getFileName());
    response.setContentType(attachment.getContentType());
    response.setDataUrl(attachment.getDataUrl());
    response.setUploadedAt(attachment.getUploadedAt());
    return response;
  }
}
