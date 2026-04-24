package com.it3030.paf.smartcampus.api.dto;

import com.it3030.paf.smartcampus.domain.enums.TicketCategory;
import com.it3030.paf.smartcampus.domain.enums.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class TicketCreateRequest {

  @NotNull(message = "category is required")
  private TicketCategory category;

  @NotBlank(message = "subject is required")
  @Size(max = 255, message = "subject must be <= 255 characters")
  private String subject;

  @NotBlank(message = "description is required")
  @Size(max = 2000, message = "description must be <= 2000 characters")
  private String description;

  private TicketPriority priority;

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

  public TicketPriority getPriority() {
    return priority;
  }

  public void setPriority(TicketPriority priority) {
    this.priority = priority;
  }
}
