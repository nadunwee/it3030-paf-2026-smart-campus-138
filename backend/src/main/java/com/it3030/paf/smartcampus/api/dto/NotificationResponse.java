package com.it3030.paf.smartcampus.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.it3030.paf.smartcampus.domain.enums.NotificationType;
import com.it3030.paf.smartcampus.domain.enums.RelatedEntityType;
import java.time.OffsetDateTime;

public class NotificationResponse {

  private Long notificationId;
  private String title;
  private String message;
  private NotificationType type;
  private RelatedEntityType relatedEntityType;
  private Long relatedEntityId;
  private boolean isRead;
  private OffsetDateTime createdAt;
  private String actionUrl;
  private Long senderId;
  private String senderName;

  public Long getNotificationId() {
    return notificationId;
  }

  public void setNotificationId(Long notificationId) {
    this.notificationId = notificationId;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public NotificationType getType() {
    return type;
  }

  public void setType(NotificationType type) {
    this.type = type;
  }

  public RelatedEntityType getRelatedEntityType() {
    return relatedEntityType;
  }

  public void setRelatedEntityType(RelatedEntityType relatedEntityType) {
    this.relatedEntityType = relatedEntityType;
  }

  public Long getRelatedEntityId() {
    return relatedEntityId;
  }

  public void setRelatedEntityId(Long relatedEntityId) {
    this.relatedEntityId = relatedEntityId;
  }

  @JsonProperty("isRead")
  public boolean isRead() {
    return isRead;
  }

  @JsonProperty("isRead")
  public void setRead(boolean read) {
    isRead = read;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public String getActionUrl() {
    return actionUrl;
  }

  public void setActionUrl(String actionUrl) {
    this.actionUrl = actionUrl;
  }

  public Long getSenderId() {
    return senderId;
  }

  public void setSenderId(Long senderId) {
    this.senderId = senderId;
  }

  public String getSenderName() {
    return senderName;
  }

  public void setSenderName(String senderName) {
    this.senderName = senderName;
  }
}
