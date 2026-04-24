package com.it3030.paf.smartcampus.domain;

import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.NotificationType;
import com.it3030.paf.smartcampus.domain.enums.RelatedEntityType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "notification_id")
  private Long notificationId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private UserAccount targetUser;

  @Enumerated(EnumType.STRING)
  @Column(name = "user_role", nullable = false, length = 16)
  private AppRole userRole;

  @Column(name = "title", nullable = false, length = 160)
  private String title;

  @Column(name = "message", nullable = false, length = 500)
  private String message;

  @Enumerated(EnumType.STRING)
  @Column(name = "type", nullable = false, length = 64)
  private NotificationType type;

  @Enumerated(EnumType.STRING)
  @Column(name = "related_entity_type", length = 32)
  private RelatedEntityType relatedEntityType;

  @Column(name = "related_entity_id")
  private Long relatedEntityId;

  @Column(name = "checked", nullable = false)
  private boolean read;

  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @Column(name = "action_url", length = 255)
  private String actionUrl;

  @Column(name = "sender_id")
  private Long senderId;

  @Column(name = "sender_name", length = 64)
  private String senderName;

  @PrePersist
  void onCreate() {
    if (createdAt == null) {
      createdAt = OffsetDateTime.now();
    }
  }

  public Long getNotificationId() {
    return notificationId;
  }

  public UserAccount getTargetUser() {
    return targetUser;
  }

  public void setTargetUser(UserAccount targetUser) {
    this.targetUser = targetUser;
  }

  public AppRole getUserRole() {
    return userRole;
  }

  public void setUserRole(AppRole userRole) {
    this.userRole = userRole;
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

  public boolean isRead() {
    return read;
  }

  public void setRead(boolean read) {
    this.read = read;
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
