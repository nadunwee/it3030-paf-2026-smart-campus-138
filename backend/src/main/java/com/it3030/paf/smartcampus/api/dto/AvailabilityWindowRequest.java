package com.it3030.paf.smartcampus.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.AssertTrue;
import java.time.OffsetDateTime;

public class AvailabilityWindowRequest {

  @NotNull(message = "startDateTime is required")
  private OffsetDateTime startDateTime;

  @NotNull(message = "endDateTime is required")
  private OffsetDateTime endDateTime;

  @AssertTrue(message = "endDateTime must be after startDateTime")
  public boolean isValidRange() {
    if (startDateTime == null || endDateTime == null) {
      return true; // handled by @NotNull
    }
    return endDateTime.isAfter(startDateTime);
  }

  public OffsetDateTime getStartDateTime() {
    return startDateTime;
  }

  public void setStartDateTime(OffsetDateTime startDateTime) {
    this.startDateTime = startDateTime;
  }

  public OffsetDateTime getEndDateTime() {
    return endDateTime;
  }

  public void setEndDateTime(OffsetDateTime endDateTime) {
    this.endDateTime = endDateTime;
  }
}

