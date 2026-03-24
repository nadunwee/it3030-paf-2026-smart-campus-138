package com.smartcampus.service;

import com.smartcampus.model.Booking;
import com.smartcampus.model.IncidentTicket;
import com.smartcampus.model.Notification;
import com.smartcampus.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public void notifyBookingApproved(Booking booking) {
        createNotification(booking.getUser().getId(), Notification.NotificationType.BOOKING_APPROVED,
                "Your booking for " + booking.getResource().getName() + " on " +
                booking.getBookingDate() + " has been approved.", booking.getId());
    }

    public void notifyBookingRejected(Booking booking) {
        createNotification(booking.getUser().getId(), Notification.NotificationType.BOOKING_REJECTED,
                "Your booking for " + booking.getResource().getName() + " on " +
                booking.getBookingDate() + " has been rejected." +
                (booking.getReviewReason() != null ? " Reason: " + booking.getReviewReason() : ""),
                booking.getId());
    }

    public void notifyTicketStatusChanged(IncidentTicket ticket) {
        createNotification(ticket.getReporter().getId(), Notification.NotificationType.TICKET_STATUS_CHANGED,
                "Your incident ticket #" + ticket.getId() + " status has changed to " + ticket.getStatus(),
                ticket.getId());
    }

    public void notifyTicketComment(IncidentTicket ticket, Long commentAuthorId) {
        if (!ticket.getReporter().getId().equals(commentAuthorId)) {
            createNotification(ticket.getReporter().getId(), Notification.NotificationType.TICKET_COMMENT_ADDED,
                    "A new comment was added to your incident ticket #" + ticket.getId(), ticket.getId());
        }
    }

    private void createNotification(Long userId, Notification.NotificationType type,
                                    String message, Long relatedId) {
        Notification notification = new Notification();
        notification.setUser(new com.smartcampus.model.User());
        notification.getUser().setId(userId);
        notification.setType(type);
        notification.setMessage(message);
        notification.setRelatedId(relatedId);
        notificationRepository.save(notification);
    }
}
