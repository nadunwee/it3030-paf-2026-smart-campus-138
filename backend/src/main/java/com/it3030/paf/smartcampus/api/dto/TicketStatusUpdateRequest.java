package com.it3030.paf.smartcampus.api.dto;

import com.it3030.paf.smartcampus.domain.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class TicketStatusUpdateRequest {

  @NotNull(message = "status is required")
  private TicketStatus status;

  @Size(max = 4000, message = "resolutionNotes must be <= 4000 characters")
  private String resolutionNotes;

  @Size(max = 1000, message = "reason must be <= 1000 characters")
  private String reason;

  public TicketStatus getStatus() {
    return status;
  }

  public void setStatus(TicketStatus status) {
    this.status = status;
  }

  public String getResolutionNotes() {
    return resolutionNotes;
  }

  public void setResolutionNotes(String resolutionNotes) {
    this.resolutionNotes = resolutionNotes;
  }

  public String getReason() {
    return reason;
  }

  public void setReason(String reason) {
    this.reason = reason;
  }
}
