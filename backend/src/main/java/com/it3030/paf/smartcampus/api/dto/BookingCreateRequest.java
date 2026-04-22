package com.it3030.paf.smartcampus.api.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import java.time.OffsetDateTime;

public class BookingCreateRequest {

  @NotNull(message = "facilityId is required")
  private Long facilityId;

  @NotBlank(message = "purpose is required")
  @Size(max = 500, message = "purpose must be <= 500 characters")
  private String purpose;

  @NotNull(message = "durationMinutes is required")
  @Min(value = 1, message = "durationMinutes must be >= 1")
  private Integer durationMinutes;

  @NotNull(message = "bookedFrom is required")
  private OffsetDateTime bookedFrom;

  @NotNull(message = "bookedTo is required")
  private OffsetDateTime bookedTo;

  @AssertTrue(message = "bookedTo must be after bookedFrom")
  public boolean isValidRange() {
    if (bookedFrom == null || bookedTo == null) {
      return true;
    }
    return bookedTo.isAfter(bookedFrom);
  }

  @AssertTrue(message = "durationMinutes must match bookedFrom and bookedTo")
  public boolean isDurationConsistent() {
    if (bookedFrom == null || bookedTo == null || durationMinutes == null) {
      return true;
    }
    if (!bookedTo.isAfter(bookedFrom)) {
      return true;
    }
    long calculated = Duration.between(bookedFrom, bookedTo).toMinutes();
    return calculated == durationMinutes;
  }

  public Long getFacilityId() {
    return facilityId;
  }

  public void setFacilityId(Long facilityId) {
    this.facilityId = facilityId;
  }

  public String getPurpose() {
    return purpose;
  }

  public void setPurpose(String purpose) {
    this.purpose = purpose;
  }

  public Integer getDurationMinutes() {
    return durationMinutes;
  }

  public void setDurationMinutes(Integer durationMinutes) {
    this.durationMinutes = durationMinutes;
  }

  public OffsetDateTime getBookedFrom() {
    return bookedFrom;
  }

  public void setBookedFrom(OffsetDateTime bookedFrom) {
    this.bookedFrom = bookedFrom;
  }

  public OffsetDateTime getBookedTo() {
    return bookedTo;
  }

  public void setBookedTo(OffsetDateTime bookedTo) {
    this.bookedTo = bookedTo;
  }
}
