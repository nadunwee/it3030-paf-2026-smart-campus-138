package com.it3030.paf.smartcampus.domain;

import com.it3030.paf.smartcampus.domain.enums.BookingStatus;
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
@Table(name = "bookings")
public class Booking {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "booking_id")
  private Long bookingId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "facility_id", nullable = false)
  private FacilityResource facilityResource;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "booked_by_user_id", nullable = false)
  private UserAccount bookedByUser;

  @Column(name = "booked_by_user_name", nullable = false, length = 64)
  private String bookedByUserName;

  @Column(name = "facility_name", nullable = false, length = 255)
  private String facilityName;

  @Column(name = "purpose", nullable = false, length = 500)
  private String purpose;

  @Column(name = "duration_minutes", nullable = false)
  private Integer durationMinutes;

  @Column(name = "booked_from", nullable = false)
  private OffsetDateTime bookedFrom;

  @Column(name = "booked_to", nullable = false)
  private OffsetDateTime bookedTo;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 16)
  private BookingStatus status;

  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @Column(name = "approved_at")
  private OffsetDateTime approvedAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) {
      createdAt = OffsetDateTime.now();
    }
  }

  public Long getBookingId() {
    return bookingId;
  }

  public FacilityResource getFacilityResource() {
    return facilityResource;
  }

  public void setFacilityResource(FacilityResource facilityResource) {
    this.facilityResource = facilityResource;
  }

  public UserAccount getBookedByUser() {
    return bookedByUser;
  }

  public void setBookedByUser(UserAccount bookedByUser) {
    this.bookedByUser = bookedByUser;
  }

  public String getBookedByUserName() {
    return bookedByUserName;
  }

  public void setBookedByUserName(String bookedByUserName) {
    this.bookedByUserName = bookedByUserName;
  }

  public String getFacilityName() {
    return facilityName;
  }

  public void setFacilityName(String facilityName) {
    this.facilityName = facilityName;
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
