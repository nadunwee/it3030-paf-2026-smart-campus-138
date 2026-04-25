package com.it3030.paf.smartcampus.api.controller;

import com.it3030.paf.smartcampus.api.dto.TicketAssignmentRequest;
import com.it3030.paf.smartcampus.api.dto.TicketCreateRequest;
import com.it3030.paf.smartcampus.api.dto.TicketDetailResponse;
import com.it3030.paf.smartcampus.api.dto.TicketMessageUpdateRequest;
import com.it3030.paf.smartcampus.api.dto.TicketOpenCountResponse;
import com.it3030.paf.smartcampus.api.dto.TicketReplyRequest;
import com.it3030.paf.smartcampus.api.dto.TicketResponse;
import com.it3030.paf.smartcampus.api.dto.TicketStatusUpdateRequest;
import com.it3030.paf.smartcampus.domain.enums.TicketCategory;
import com.it3030.paf.smartcampus.domain.enums.TicketPriority;
import com.it3030.paf.smartcampus.domain.enums.TicketStatus;
import com.it3030.paf.smartcampus.service.TicketingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tickets")
public class TicketingController {

  private static final int MAX_PAGE_SIZE = 50;

  private final TicketingService ticketingService;

  public TicketingController(TicketingService ticketingService) {
    this.ticketingService = ticketingService;
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER')")
  public ResponseEntity<TicketDetailResponse> createTicket(
      @Valid @RequestBody TicketCreateRequest request,
      Authentication authentication) {
    TicketDetailResponse created = ticketingService.createTicket(request, authentication.getName());
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @GetMapping("/my")
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER')")
  public ResponseEntity<Page<TicketResponse>> listMyTickets(
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "20", name = "size") int size,
      Authentication authentication) {
    validatePage(page, size);
    PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
    return ResponseEntity.ok(ticketingService.listMyTickets(authentication.getName(), pageable));
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
  public ResponseEntity<Page<TicketResponse>> listAllTickets(
      @RequestParam(required = false, name = "status") TicketStatus status,
      @RequestParam(required = false, name = "category") TicketCategory category,
      @RequestParam(required = false, name = "priority") TicketPriority priority,
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "20", name = "size") int size,
      Authentication authentication) {
    validatePage(page, size);
    PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
    return ResponseEntity.ok(
        ticketingService.listVisibleStaffTickets(status, category, priority, authentication.getName(), pageable));
  }

  @GetMapping("/{ticketId}")
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
  public ResponseEntity<TicketDetailResponse> getTicket(
      @PathVariable("ticketId") Long ticketId,
      Authentication authentication) {
    return ResponseEntity.ok(ticketingService.getTicketWithMessages(ticketId, authentication.getName(), isAdmin(authentication)));
  }

  @PostMapping("/{ticketId}/messages")
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
  public ResponseEntity<TicketDetailResponse> replyToTicket(
      @PathVariable("ticketId") Long ticketId,
      @Valid @RequestBody TicketReplyRequest request,
      Authentication authentication) {
    TicketDetailResponse response =
        ticketingService.replyToTicket(ticketId, request, authentication.getName(), isAdmin(authentication));
    return ResponseEntity.ok(response);
  }

  @PatchMapping("/{ticketId}/status")
  @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
  public ResponseEntity<TicketResponse> updateTicketStatus(
      @PathVariable("ticketId") Long ticketId,
      @Valid @RequestBody TicketStatusUpdateRequest request,
      Authentication authentication) {
    TicketResponse updated =
        ticketingService.updateTicketStatus(
            ticketId,
            request.getStatus(),
            request.getResolutionNotes(),
            request.getReason(),
            authentication.getName());
    return ResponseEntity.ok(updated);
  }

  @PatchMapping("/{ticketId}/assignment")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<TicketResponse> assignTicket(
      @PathVariable("ticketId") Long ticketId,
      @Valid @RequestBody TicketAssignmentRequest request,
      Authentication authentication) {
    TicketResponse updated =
        ticketingService.assignTicket(ticketId, request.getAssignedStaffId(), authentication.getName());
    return ResponseEntity.ok(updated);
  }

  @PatchMapping("/{ticketId}/messages/{messageId}")
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
  public ResponseEntity<TicketDetailResponse> updateMessage(
      @PathVariable("ticketId") Long ticketId,
      @PathVariable("messageId") Long messageId,
      @Valid @RequestBody TicketMessageUpdateRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(ticketingService.updateMessage(ticketId, messageId, request, authentication.getName()));
  }

  @DeleteMapping("/{ticketId}/messages/{messageId}")
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
  public ResponseEntity<TicketDetailResponse> deleteMessage(
      @PathVariable("ticketId") Long ticketId,
      @PathVariable("messageId") Long messageId,
      Authentication authentication) {
    return ResponseEntity.ok(ticketingService.deleteMessage(ticketId, messageId, authentication.getName()));
  }

  @PostMapping("/{ticketId}/close")
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER')")
  public ResponseEntity<TicketResponse> closeTicket(
      @PathVariable("ticketId") Long ticketId,
      Authentication authentication) {
    TicketResponse closed = ticketingService.closeTicket(ticketId, authentication.getName());
    return ResponseEntity.ok(closed);
  }

  @GetMapping("/open/count")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<TicketOpenCountResponse> openTicketCount() {
    return ResponseEntity.ok(new TicketOpenCountResponse(ticketingService.countOpenTickets()));
  }

  private void validatePage(int page, int size) {
    if (page < 0) {
      throw new IllegalArgumentException("page must be >= 0");
    }
    if (size < 1 || size > MAX_PAGE_SIZE) {
      throw new IllegalArgumentException("size must be between 1 and " + MAX_PAGE_SIZE);
    }
  }

  private boolean isAdmin(Authentication authentication) {
    if (authentication == null || authentication.getAuthorities() == null) {
      return false;
    }
    return authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
  }
}
