package com.it3030.paf.smartcampus.api.dto;

import com.it3030.paf.smartcampus.domain.enums.NotificationType;
import com.it3030.paf.smartcampus.domain.enums.RelatedEntityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class NotificationCreateRequest {

  @NotNull(message = "userId is required")
  private Long userId;

  @NotBlank(message = "title is required")
  @Size(max = 160, message = "title must be <= 160 characters")
  private String title;

  @NotBlank(message = "message is required")
  @Size(max = 500, message = "message must be <= 500 characters")
  private String message;

  @NotNull(message = "type is required")
  private NotificationType type;

  private RelatedEntityType relatedEntityType;

  private Long relatedEntityId;

  @Size(max = 255, message = "actionUrl must be <= 255 characters")
  private String actionUrl;

  public Long getUserId() {
    return userId;
  }

  public void setUserId(Long userId) {
    this.userId = userId;
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

  public String getActionUrl() {
    return actionUrl;
  }

  public void setActionUrl(String actionUrl) {
    this.actionUrl = actionUrl;
  }
}
