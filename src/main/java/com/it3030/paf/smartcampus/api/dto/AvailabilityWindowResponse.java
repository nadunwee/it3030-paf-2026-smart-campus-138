package com.it3030.paf.smartcampus.api.dto;

import java.time.OffsetDateTime;

public class AvailabilityWindowResponse {
  private OffsetDateTime startDateTime;
  private OffsetDateTime endDateTime;

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

