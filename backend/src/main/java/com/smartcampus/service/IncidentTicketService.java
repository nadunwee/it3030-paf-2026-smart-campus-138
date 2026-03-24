package com.smartcampus.service;

import com.smartcampus.dto.CommentRequest;
import com.smartcampus.dto.TicketRequest;
import com.smartcampus.dto.TicketStatusUpdateRequest;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.model.IncidentTicket;
import com.smartcampus.model.Resource;
import com.smartcampus.model.TicketAttachment;
import com.smartcampus.model.TicketComment;
import com.smartcampus.model.User;
import com.smartcampus.repository.IncidentTicketRepository;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.repository.TicketCommentRepository;
import com.smartcampus.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class IncidentTicketService {

    private static final int MAX_ATTACHMENTS = 3;

    private final IncidentTicketRepository ticketRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final TicketCommentRepository commentRepository;
    private final NotificationService notificationService;

    public IncidentTicketService(IncidentTicketRepository ticketRepository,
                                 ResourceRepository resourceRepository,
                                 UserRepository userRepository,
                                 TicketCommentRepository commentRepository,
                                 NotificationService notificationService) {
        this.ticketRepository = ticketRepository;
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.notificationService = notificationService;
    }

    public List<IncidentTicket> getAllTickets(IncidentTicket.TicketStatus status,
                                              IncidentTicket.TicketPriority priority,
                                              IncidentTicket.TicketCategory category) {
        return ticketRepository.findByFilters(status, priority, category);
    }

    public List<IncidentTicket> getTicketsByUser(Long userId) {
        return ticketRepository.findByReporterId(userId);
    }

    public IncidentTicket getTicketById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));
    }

    public IncidentTicket createTicket(TicketRequest request, List<MultipartFile> files, User reporter) throws IOException {
        IncidentTicket ticket = new IncidentTicket();

        if (request.getResourceId() != null) {
            Resource resource = resourceRepository.findById(request.getResourceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + request.getResourceId()));
            ticket.setResource(resource);
        }

        ticket.setLocation(request.getLocation());
        ticket.setReporter(reporter);
        ticket.setCategory(request.getCategory());
        ticket.setDescription(request.getDescription());
        if (request.getPriority() != null) {
            ticket.setPriority(request.getPriority());
        }
        ticket.setContactDetails(request.getContactDetails());

        if (files != null && !files.isEmpty()) {
            if (files.size() > MAX_ATTACHMENTS) {
                throw new IllegalArgumentException("Maximum " + MAX_ATTACHMENTS + " attachments allowed");
            }
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    TicketAttachment attachment = new TicketAttachment();
                    attachment.setTicket(ticket);
                    attachment.setFileName(file.getOriginalFilename());
                    attachment.setContentType(file.getContentType());
                    attachment.setData(file.getBytes());
                    ticket.getAttachments().add(attachment);
                }
            }
        }

        return ticketRepository.save(ticket);
    }

    public IncidentTicket updateTicketStatus(Long id, TicketStatusUpdateRequest request, User currentUser) {
        IncidentTicket ticket = getTicketById(id);

        if (request.getStatus() != null) {
            ticket.setStatus(request.getStatus());
        }
        if (request.getResolutionNotes() != null) {
            ticket.setResolutionNotes(request.getResolutionNotes());
        }
        if (request.getRejectionReason() != null) {
            ticket.setRejectionReason(request.getRejectionReason());
        }
        if (request.getAssignedToId() != null) {
            User technician = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getAssignedToId()));
            ticket.setAssignedTo(technician);
        }

        ticket.setUpdatedAt(LocalDateTime.now());
        IncidentTicket saved = ticketRepository.save(ticket);
        notificationService.notifyTicketStatusChanged(saved);
        return saved;
    }

    public TicketComment addComment(Long ticketId, CommentRequest request, User author) {
        IncidentTicket ticket = getTicketById(ticketId);
        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setAuthor(author);
        comment.setContent(request.getContent());
        TicketComment saved = commentRepository.save(comment);
        notificationService.notifyTicketComment(ticket, author.getId());
        return saved;
    }

    public TicketComment updateComment(Long commentId, CommentRequest request, User currentUser) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
        if (!comment.getAuthor().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only edit your own comments");
        }
        comment.setContent(request.getContent());
        comment.setUpdatedAt(LocalDateTime.now());
        return commentRepository.save(comment);
    }

    public void deleteComment(Long commentId, User currentUser) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
        if (!comment.getAuthor().getId().equals(currentUser.getId()) &&
                currentUser.getRole() != User.Role.ADMIN) {
            throw new UnauthorizedException("You are not authorized to delete this comment");
        }
        commentRepository.delete(comment);
    }

    public List<TicketComment> getComments(Long ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }
}
