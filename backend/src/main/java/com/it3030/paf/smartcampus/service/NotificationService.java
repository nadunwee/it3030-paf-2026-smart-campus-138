package com.it3030.paf.smartcampus.service;

import com.it3030.paf.smartcampus.api.dto.NotificationCreateRequest;
import com.it3030.paf.smartcampus.api.dto.NotificationResponse;
import com.it3030.paf.smartcampus.domain.Notification;
import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.NotificationType;
import com.it3030.paf.smartcampus.domain.enums.RelatedEntityType;
import com.it3030.paf.smartcampus.exception.ResourceNotFoundException;
import com.it3030.paf.smartcampus.repository.NotificationRepository;
import com.it3030.paf.smartcampus.repository.UserAccountRepository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

  private final NotificationRepository notificationRepository;
  private final UserAccountRepository userAccountRepository;

  public NotificationService(
      NotificationRepository notificationRepository,
      UserAccountRepository userAccountRepository) {
    this.notificationRepository = notificationRepository;
    this.userAccountRepository = userAccountRepository;
  }

  @Transactional
  public NotificationResponse createNotification(NotificationCreateRequest request, String actorUsername) {
    UserAccount actor = getRequiredUser(actorUsername);
    if (actor.getRole() != AppRole.ADMIN) {
      throw new AccessDeniedException("Only admin users can create notifications manually");
    }

    UserAccount targetUser =
        userAccountRepository
            .findById(request.getUserId())
            .orElseThrow(() -> new ResourceNotFoundException("Target user not found"));

    Notification saved =
        createAndSave(
            targetUser,
            request.getType(),
            request.getTitle().trim(),
            request.getMessage().trim(),
            request.getRelatedEntityType() == null ? RelatedEntityType.SYSTEM : request.getRelatedEntityType(),
            request.getRelatedEntityId(),
            request.getActionUrl(),
            actor);

    return toResponse(saved);
  }

  @Transactional(readOnly = true)
  public Page<NotificationResponse> listMyNotifications(String username, Pageable pageable) {
    UserAccount currentUser = getRequiredUser(username);
    return notificationRepository
        .findByTargetUserIdOrderByCreatedAtDesc(currentUser.getId(), pageable)
        .map(this::toResponse);
  }

  @Transactional(readOnly = true)
  public long unreadCount(String username) {
    UserAccount currentUser = getRequiredUser(username);
    return notificationRepository.countByTargetUserIdAndReadFalse(currentUser.getId());
  }

  @Transactional
  public NotificationResponse markAsRead(Long notificationId, String username) {
    UserAccount currentUser = getRequiredUser(username);
    Notification notification =
        notificationRepository
            .findByNotificationIdAndTargetUserId(notificationId, currentUser.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

    if (!notification.isRead()) {
      notification.setRead(true);
    }
    return toResponse(notificationRepository.save(notification));
  }

  @Transactional
  public long markAllAsRead(String username) {
    UserAccount currentUser = getRequiredUser(username);
    return notificationRepository.markAllAsReadByUserId(currentUser.getId());
  }

  @Transactional
  public void deleteOne(Long notificationId, String username) {
    UserAccount currentUser = getRequiredUser(username);
    long deleted = notificationRepository.deleteByNotificationIdAndTargetUserId(notificationId, currentUser.getId());
    if (deleted == 0) {
      throw new ResourceNotFoundException("Notification not found");
    }
  }

  @Transactional
  public long clearAll(String username) {
    UserAccount currentUser = getRequiredUser(username);
    return notificationRepository.deleteByTargetUserId(currentUser.getId());
  }

  @Transactional
  public void notifyUser(
      UserAccount targetUser,
      NotificationType type,
      String title,
      String message,
      RelatedEntityType relatedEntityType,
      Long relatedEntityId,
      String actionUrl,
      UserAccount sender) {
    createAndSave(targetUser, type, title, message, relatedEntityType, relatedEntityId, actionUrl, sender);
  }

  @Transactional
  public void notifyAdmins(
      NotificationType type,
      String title,
      String message,
      RelatedEntityType relatedEntityType,
      Long relatedEntityId,
      String actionUrl,
      UserAccount sender) {
    notifyUsersByRole(AppRole.ADMIN, type, title, message, relatedEntityType, relatedEntityId, actionUrl, sender);
  }

  @Transactional
  public void notifyUsersByRole(
      AppRole role,
      NotificationType type,
      String title,
      String message,
      RelatedEntityType relatedEntityType,
      Long relatedEntityId,
      String actionUrl,
      UserAccount sender) {
    List<UserAccount> users = userAccountRepository.findAllByRole(role);
    if (users.isEmpty()) {
      return;
    }

    List<Notification> notifications =
        users.stream()
            .map(
                target ->
                    buildNotification(
                        target,
                        type,
                        title,
                        message,
                        relatedEntityType,
                        relatedEntityId,
                        actionUrl,
                        sender))
            .toList();
    notificationRepository.saveAll(notifications);
  }

  private Notification createAndSave(
      UserAccount targetUser,
      NotificationType type,
      String title,
      String message,
      RelatedEntityType relatedEntityType,
      Long relatedEntityId,
      String actionUrl,
      UserAccount sender) {
    Notification notification =
        buildNotification(
            targetUser, type, title, message, relatedEntityType, relatedEntityId, actionUrl, sender);
    return notificationRepository.save(notification);
  }

  private Notification buildNotification(
      UserAccount targetUser,
      NotificationType type,
      String title,
      String message,
      RelatedEntityType relatedEntityType,
      Long relatedEntityId,
      String actionUrl,
      UserAccount sender) {
    Notification notification = new Notification();
    notification.setTargetUser(targetUser);
    notification.setUserRole(targetUser.getRole());
    notification.setType(type);
    notification.setTitle(title.trim());
    notification.setMessage(message.trim());
    notification.setRelatedEntityType(relatedEntityType == null ? RelatedEntityType.SYSTEM : relatedEntityType);
    notification.setRelatedEntityId(relatedEntityId);
    notification.setRead(false);
    notification.setActionUrl(actionUrl == null ? null : actionUrl.trim());
    notification.setSenderId(sender == null ? null : sender.getId());
    notification.setSenderName(sender == null ? null : sender.getUsername());
    return notification;
  }

  private UserAccount getRequiredUser(String username) {
    return userAccountRepository
        .findByUsername(username)
        .orElseThrow(() -> new ResourceNotFoundException("User account not found"));
  }

  private NotificationResponse toResponse(Notification notification) {
    NotificationResponse response = new NotificationResponse();
    response.setNotificationId(notification.getNotificationId());
    response.setTitle(notification.getTitle());
    response.setMessage(notification.getMessage());
    response.setType(notification.getType());
    response.setRelatedEntityType(notification.getRelatedEntityType());
    response.setRelatedEntityId(notification.getRelatedEntityId());
    response.setRead(notification.isRead());
    response.setCreatedAt(notification.getCreatedAt());
    response.setActionUrl(notification.getActionUrl());
    response.setSenderId(notification.getSenderId());
    response.setSenderName(notification.getSenderName());
    return response;
  }
}
