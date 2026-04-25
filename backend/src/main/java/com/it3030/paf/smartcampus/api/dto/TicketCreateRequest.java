package com.it3030.paf.smartcampus.api.dto;

import com.it3030.paf.smartcampus.domain.enums.TicketCategory;
import com.it3030.paf.smartcampus.domain.enums.TicketPriority;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

public class TicketCreateRequest {

  @NotNull(message = "category is required")
  private TicketCategory category;

  @NotBlank(message = "subject is required")
  @Size(max = 255, message = "subject must be <= 255 characters")
  private String subject;

  @NotBlank(message = "description is required")
  @Size(max = 2000, message = "description must be <= 2000 characters")
  private String description;

  private Long resourceId;

  @Size(max = 255, message = "location must be <= 255 characters")
  private String location;

  @NotBlank(message = "preferredContactDetails is required")
  @Size(max = 255, message = "preferredContactDetails must be <= 255 characters")
  private String preferredContactDetails;

  private TicketPriority priority;

  @Valid
  @Size(max = 3, message = "attachments cannot exceed 3 images")
  private List<TicketAttachmentRequest> attachments = new ArrayList<>();

  @AssertTrue(message = "resourceId or location is required")
  public boolean hasResourceOrLocation() {
    return resourceId != null || (location != null && !location.trim().isEmpty());
  }

  public TicketCategory getCategory() {
    return category;
  }

  public void setCategory(TicketCategory category) {
    this.category = category;
  }

  public String getSubject() {
    return subject;
  }

  public void setSubject(String subject) {
    this.subject = subject;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public Long getResourceId() {
    return resourceId;
  }

  public void setResourceId(Long resourceId) {
    this.resourceId = resourceId;
  }

  public String getLocation() {
    return location;
  }

  public void setLocation(String location) {
    this.location = location;
  }

  public String getPreferredContactDetails() {
    return preferredContactDetails;
  }

  public void setPreferredContactDetails(String preferredContactDetails) {
    this.preferredContactDetails = preferredContactDetails;
  }

  public TicketPriority getPriority() {
    return priority;
  }

  public void setPriority(TicketPriority priority) {
    this.priority = priority;
  }

  public List<TicketAttachmentRequest> getAttachments() {
    return attachments;
  }

  public void setAttachments(List<TicketAttachmentRequest> attachments) {
    this.attachments = attachments;
  }
}
