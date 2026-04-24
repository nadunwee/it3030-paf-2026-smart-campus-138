package com.it3030.paf.smartcampus.service;

import com.it3030.paf.smartcampus.domain.Notification;
import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.NotificationType;
import com.it3030.paf.smartcampus.domain.enums.RelatedEntityType;
import com.it3030.paf.smartcampus.repository.NotificationRepository;
import com.it3030.paf.smartcampus.repository.UserAccountRepository;
import java.util.List;
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
  public void notifyUser(
      UserAccount recipient,
      NotificationType type,
      String title,
      String message,
      RelatedEntityType relatedEntityType,
      Long relatedEntityId,
      String actionUrl,
      UserAccount triggeredBy) {
    if (recipient == null) {
      return;
    }
    notificationRepository.save(
        buildNotification(
            recipient, type, title, message, relatedEntityType, relatedEntityId, actionUrl, triggeredBy));
  }

  @Transactional
  public void notifyAdmins(
      NotificationType type,
      String title,
      String message,
      RelatedEntityType relatedEntityType,
      Long relatedEntityId,
      String actionUrl,
      UserAccount triggeredBy) {
    notifyUsersByRole(
        AppRole.ADMIN,
        type,
        title,
        message,
        relatedEntityType,
        relatedEntityId,
        actionUrl,
        triggeredBy);
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
      UserAccount triggeredBy) {
    List<UserAccount> users = userAccountRepository.findAllByRole(role);
    if (users.isEmpty()) {
      return;
    }
    List<Notification> notifications =
        users.stream()
            .map(
                user ->
                    buildNotification(
                        user, type, title, message, relatedEntityType, relatedEntityId, actionUrl, triggeredBy))
            .toList();
    notificationRepository.saveAll(notifications);
  }

  private Notification buildNotification(
      UserAccount recipient,
      NotificationType type,
      String title,
      String message,
      RelatedEntityType relatedEntityType,
      Long relatedEntityId,
      String actionUrl,
      UserAccount triggeredBy) {
    Notification notification = new Notification();
    notification.setTargetUser(recipient);
    notification.setUserRole(recipient.getRole());
    notification.setType(type == null ? NotificationType.SYSTEM : type);
    notification.setTitle(title == null ? "" : title.trim());
    notification.setMessage(message == null ? "" : message.trim());
    notification.setRelatedEntityType(
        relatedEntityType == null ? RelatedEntityType.SYSTEM : relatedEntityType);
    notification.setRelatedEntityId(relatedEntityId);
    notification.setRead(false);
    notification.setActionUrl(actionUrl == null ? null : actionUrl.trim());
    notification.setSenderId(triggeredBy == null ? null : triggeredBy.getId());
    notification.setSenderName(triggeredBy == null ? null : triggeredBy.getUsername());
    return notification;
  }
}
