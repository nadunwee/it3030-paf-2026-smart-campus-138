package com.smartcampus.controller;

import com.smartcampus.dto.CommentRequest;
import com.smartcampus.dto.TicketRequest;
import com.smartcampus.dto.TicketStatusUpdateRequest;
import com.smartcampus.model.IncidentTicket;
import com.smartcampus.model.TicketComment;
import com.smartcampus.model.User;
import com.smartcampus.service.IncidentTicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class IncidentTicketController {

    private final IncidentTicketService ticketService;

    public IncidentTicketController(IncidentTicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<List<IncidentTicket>> getAllTickets(
            @RequestParam(required = false) IncidentTicket.TicketStatus status,
            @RequestParam(required = false) IncidentTicket.TicketPriority priority,
            @RequestParam(required = false) IncidentTicket.TicketCategory category) {
        return ResponseEntity.ok(ticketService.getAllTickets(status, priority, category));
    }

    @GetMapping("/my")
    public ResponseEntity<List<IncidentTicket>> getMyTickets(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ticketService.getTicketsByUser(currentUser.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentTicket> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<IncidentTicket> createTicket(
            @RequestPart("ticket") @Valid TicketRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal User currentUser) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.createTicket(request, files, currentUser));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<IncidentTicket> updateStatus(@PathVariable Long id,
                                                       @RequestBody TicketStatusUpdateRequest request,
                                                       @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(id, request, currentUser));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<TicketComment>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getComments(id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketComment> addComment(@PathVariable Long id,
                                                    @Valid @RequestBody CommentRequest request,
                                                    @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.addComment(id, request, currentUser));
    }

    @PutMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<TicketComment> updateComment(@PathVariable Long ticketId,
                                                       @PathVariable Long commentId,
                                                       @Valid @RequestBody CommentRequest request,
                                                       @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ticketService.updateComment(commentId, request, currentUser));
    }

    @DeleteMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long ticketId,
                                              @PathVariable Long commentId,
                                              @AuthenticationPrincipal User currentUser) {
        ticketService.deleteComment(commentId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
