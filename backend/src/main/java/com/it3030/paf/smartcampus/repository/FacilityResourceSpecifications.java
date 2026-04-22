package com.it3030.paf.smartcampus.repository;

import com.it3030.paf.smartcampus.domain.AvailabilityWindow;
import com.it3030.paf.smartcampus.domain.Booking;
import com.it3030.paf.smartcampus.domain.FacilityResource;
import com.it3030.paf.smartcampus.domain.enums.BookingStatus;
import com.it3030.paf.smartcampus.domain.enums.ResourceStatus;
import com.it3030.paf.smartcampus.domain.enums.ResourceType;
import java.time.OffsetDateTime;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

public final class FacilityResourceSpecifications {

  private FacilityResourceSpecifications() {}

  public static Specification<FacilityResource> notDeleted() {
    return (root, query, cb) -> cb.isFalse(root.get("deleted"));
  }

  public static Specification<FacilityResource> typeEquals(ResourceType type) {
    if (type == null) {
      return null;
    }
    return (root, query, cb) -> cb.equal(root.get("type"), type);
  }

  public static Specification<FacilityResource> locationContains(String location) {
    if (location == null || location.trim().isEmpty()) {
      return null;
    }
    String lowered = location.trim().toLowerCase();
    return (root, query, cb) -> cb.like(cb.lower(root.get("location")), "%" + lowered + "%");
  }

  public static Specification<FacilityResource> capacityAtLeast(Integer capacityMin) {
    if (capacityMin == null) {
      return null;
    }
    return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("capacity"), capacityMin);
  }

  public static Specification<FacilityResource> statusEquals(ResourceStatus status) {
    if (status == null) {
      return null;
    }
    return (root, query, cb) -> cb.equal(root.get("status"), status);
  }

  public static Specification<FacilityResource> availableOn(OffsetDateTime availableOn) {
    if (availableOn == null) {
      return null;
    }
    return (root, query, cb) -> {
      // Ensure we don't return duplicates when a resource has multiple availability windows.
      query.distinct(true);

      Join<FacilityResource, AvailabilityWindow> windowJoin = root.join("availabilityWindows", JoinType.INNER);
      return cb.and(
          cb.lessThanOrEqualTo(windowJoin.get("startDateTime"), availableOn),
          cb.greaterThanOrEqualTo(windowJoin.get("endDateTime"), availableOn)
      );
    };
  }

  public static Specification<FacilityResource> notBookedBetween(OffsetDateTime from, OffsetDateTime to) {
    if (from == null || to == null) {
      return null;
    }

    return (root, query, cb) -> {
      Subquery<Long> subquery = query.subquery(Long.class);
      var bookingRoot = subquery.from(Booking.class);

      subquery
          .select(bookingRoot.get("bookingId"))
          .where(
              cb.equal(bookingRoot.get("facilityResource"), root),
              cb.equal(bookingRoot.get("status"), BookingStatus.APPROVED),
              cb.lessThan(bookingRoot.get("bookedFrom"), to),
              cb.greaterThan(bookingRoot.get("bookedTo"), from));

      return cb.not(cb.exists(subquery));
    };
  }
}
