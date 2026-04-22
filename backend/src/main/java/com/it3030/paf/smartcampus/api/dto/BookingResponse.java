package com.it3030.paf.smartcampus.api.dto;

import com.it3030.paf.smartcampus.domain.enums.BookingStatus;
import java.time.OffsetDateTime;

public class BookingResponse {

  private Long bookingId;
  private Long facilityId;
  private String facilityName;
  private Long bookedByUserId;
  private String bookedByUserName;
  private String purpose;
  private Integer durationMinutes;
  private OffsetDateTime bookedFrom;
  private OffsetDateTime bookedTo;
  private BookingStatus status;
  private OffsetDateTime createdAt;
  private OffsetDateTime approvedAt;

  public Long getBookingId() {
    return bookingId;
  }

  public void setBookingId(Long bookingId) {
    this.bookingId = bookingId;
  }

  public Long getFacilityId() {
    return facilityId;
  }

  public void setFacilityId(Long facilityId) {
    this.facilityId = facilityId;
  }

  public String getFacilityName() {
    return facilityName;
  }

  public void setFacilityName(String facilityName) {
    this.facilityName = facilityName;
  }

  public Long getBookedByUserId() {
    return bookedByUserId;
  }

  public void setBookedByUserId(Long bookedByUserId) {
    this.bookedByUserId = bookedByUserId;
  }

  public String getBookedByUserName() {
    return bookedByUserName;
  }

  public void setBookedByUserName(String bookedByUserName) {
    this.bookedByUserName = bookedByUserName;
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

  public BookingStatus getStatus() {
    return status;
  }

  public void setStatus(BookingStatus status) {
    this.status = status;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public OffsetDateTime getApprovedAt() {
    return approvedAt;
  }

  public void setApprovedAt(OffsetDateTime approvedAt) {
    this.approvedAt = approvedAt;
  }
}
