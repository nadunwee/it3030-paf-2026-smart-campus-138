package com.it3030.paf.smartcampus.repository;

import com.it3030.paf.smartcampus.domain.Booking;
import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.BookingStatus;
import java.time.OffsetDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {

  Page<Booking> findByBookedByUserOrderByCreatedAtDesc(UserAccount bookedByUser, Pageable pageable);

  long countByBookedByUserId(Long userId);

  long deleteByBookedByUserId(Long userId);

  long countByStatus(BookingStatus status);

  boolean existsByFacilityResourceIdAndStatusAndBookedFromLessThanAndBookedToGreaterThan(
      Long facilityId,
      BookingStatus status,
      OffsetDateTime bookedTo,
      OffsetDateTime bookedFrom);

  @Query(
      """
      SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
      FROM Booking b
      WHERE b.facilityResource.id = :facilityId
        AND b.status = :status
        AND b.bookedFrom < :bookedTo
        AND b.bookedTo > :bookedFrom
        AND b.bookingId <> :excludeBookingId
      """
  )
  boolean existsOverlappingBookingExcluding(
      @Param("facilityId") Long facilityId,
      @Param("status") BookingStatus status,
      @Param("bookedFrom") OffsetDateTime bookedFrom,
      @Param("bookedTo") OffsetDateTime bookedTo,
      @Param("excludeBookingId") Long excludeBookingId);
}
