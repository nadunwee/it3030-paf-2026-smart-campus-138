package com.it3030.paf.smartcampus.service;

import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.NotificationType;
import com.it3030.paf.smartcampus.domain.enums.RelatedEntityType;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

  public void notifyUser(
      UserAccount recipient,
      NotificationType type,
      String title,
      String message,
      RelatedEntityType relatedEntityType,
      Long relatedEntityId,
      String actionUrl,
      UserAccount triggeredBy) {
    // no-op placeholder to keep compilation stable until full notification persistence is wired.
  }

  public void notifyAdmins(
      NotificationType type,
      String title,
      String message,
      RelatedEntityType relatedEntityType,
      Long relatedEntityId,
      String actionUrl,
      UserAccount triggeredBy) {
    // no-op placeholder.
  }

  public void notifyUsersByRole(
      AppRole role,
      NotificationType type,
      String title,
      String message,
      RelatedEntityType relatedEntityType,
      Long relatedEntityId,
      String actionUrl,
      UserAccount triggeredBy) {
    // no-op placeholder.
  }
}
