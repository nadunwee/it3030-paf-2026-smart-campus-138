package com.it3030.paf.smartcampus.api.dto;

import com.it3030.paf.smartcampus.domain.enums.BookingStatus;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

public class BookingDecisionRequest {

  @NotNull(message = "status is required")
  private BookingStatus status;

  @AssertTrue(message = "status must be APPROVED or REJECTED")
  public boolean isValidDecision() {
    return status == null || status == BookingStatus.APPROVED || status == BookingStatus.REJECTED;
  }

  public BookingStatus getStatus() {
    return status;
  }

  public void setStatus(BookingStatus status) {
    this.status = status;
  }
}
