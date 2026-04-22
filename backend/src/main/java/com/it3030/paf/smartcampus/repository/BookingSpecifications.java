package com.it3030.paf.smartcampus.repository;

import com.it3030.paf.smartcampus.domain.Booking;
import com.it3030.paf.smartcampus.domain.enums.BookingStatus;
import java.time.OffsetDateTime;
import org.springframework.data.jpa.domain.Specification;

public final class BookingSpecifications {

  private BookingSpecifications() {}

  public static Specification<Booking> statusEquals(BookingStatus status) {
    if (status == null) {
      return null;
    }
    return (root, query, cb) -> cb.equal(root.get("status"), status);
  }

  public static Specification<Booking> facilityIdEquals(Long facilityId) {
    if (facilityId == null) {
      return null;
    }
    return (root, query, cb) -> cb.equal(root.get("facilityResource").get("id"), facilityId);
  }

  public static Specification<Booking> overlaps(OffsetDateTime from, OffsetDateTime to) {
    if (from == null && to == null) {
      return null;
    }
    if (from != null && to != null) {
      return (root, query, cb) ->
          cb.and(
              cb.lessThan(root.get("bookedFrom"), to),
              cb.greaterThan(root.get("bookedTo"), from));
    }
    if (from != null) {
      return (root, query, cb) -> cb.greaterThan(root.get("bookedTo"), from);
    }
    return (root, query, cb) -> cb.lessThan(root.get("bookedFrom"), to);
  }
}
