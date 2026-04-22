package com.it3030.paf.smartcampus.service;

import com.it3030.paf.smartcampus.api.dto.BookingCreateRequest;
import com.it3030.paf.smartcampus.api.dto.BookingResponse;
import com.it3030.paf.smartcampus.domain.Booking;
import com.it3030.paf.smartcampus.domain.FacilityResource;
import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.BookingStatus;
import com.it3030.paf.smartcampus.domain.enums.NotificationType;
import com.it3030.paf.smartcampus.domain.enums.RelatedEntityType;
import com.it3030.paf.smartcampus.domain.enums.ResourceStatus;
import com.it3030.paf.smartcampus.exception.BookingConflictException;
import com.it3030.paf.smartcampus.exception.ResourceNotFoundException;
import com.it3030.paf.smartcampus.repository.BookingRepository;
import com.it3030.paf.smartcampus.repository.BookingSpecifications;
import com.it3030.paf.smartcampus.repository.FacilityResourceRepository;
import com.it3030.paf.smartcampus.repository.UserAccountRepository;
import java.time.Duration;
import java.time.OffsetDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {

  private final BookingRepository bookingRepository;
  private final FacilityResourceRepository facilityResourceRepository;
  private final UserAccountRepository userAccountRepository;
  private final NotificationService notificationService;

  public BookingService(
      BookingRepository bookingRepository,
      FacilityResourceRepository facilityResourceRepository,
      UserAccountRepository userAccountRepository,
      NotificationService notificationService) {
    this.bookingRepository = bookingRepository;
    this.facilityResourceRepository = facilityResourceRepository;
    this.userAccountRepository = userAccountRepository;
    this.notificationService = notificationService;
  }

  @Transactional
  public BookingResponse createBooking(BookingCreateRequest request, String username) {
    UserAccount currentUser = getRequiredUser(username);
    FacilityResource resource = getActiveFacility(request.getFacilityId());

    validateBookingRange(request.getBookedFrom(), request.getBookedTo(), request.getDurationMinutes());

    boolean hasOverlap =
        bookingRepository.existsByFacilityResourceIdAndStatusAndBookedFromLessThanAndBookedToGreaterThan(
            resource.getId(),
            BookingStatus.APPROVED,
            request.getBookedTo(),
            request.getBookedFrom());
    if (hasOverlap) {
      throw new BookingConflictException("The facility is already booked for the selected time range.");
    }

    Booking booking = new Booking();
    booking.setFacilityResource(resource);
    booking.setBookedByUser(currentUser);
    booking.setBookedByUserName(currentUser.getUsername());
    booking.setFacilityName(buildFacilityName(resource));
    booking.setPurpose(request.getPurpose().trim());
    booking.setDurationMinutes(request.getDurationMinutes());
    booking.setBookedFrom(request.getBookedFrom());
    booking.setBookedTo(request.getBookedTo());
    booking.setStatus(BookingStatus.PENDING);
    booking.setApprovedAt(null);

    Booking saved = bookingRepository.save(booking);

    notificationService.notifyUser(
        currentUser,
        NotificationType.BOOKING_REQUEST_SUBMITTED,
        "Booking request submitted",
        "Your booking request for " + saved.getFacilityName() + " is pending admin approval.",
        RelatedEntityType.BOOKING,
        saved.getBookingId(),
        "/bookings",
        currentUser);

    if (currentUser.getRole() != AppRole.ADMIN) {
      notificationService.notifyAdmins(
          NotificationType.BOOKING_APPROVAL_REQUIRED,
          "Booking approval required",
          currentUser.getUsername() + " submitted a booking request for " + saved.getFacilityName() + ".",
          RelatedEntityType.BOOKING,
          saved.getBookingId(),
          "/bookings",
          currentUser);
    }

    return toResponse(saved);
  }

  @Transactional(readOnly = true)
  public Page<BookingResponse> getMyBookings(String username, Pageable pageable) {
    UserAccount currentUser = getRequiredUser(username);
    return bookingRepository.findByBookedByUserOrderByCreatedAtDesc(currentUser, pageable).map(this::toResponse);
  }

  @Transactional(readOnly = true)
  public Page<BookingResponse> getAllBookings(
      BookingStatus status, Long facilityId, OffsetDateTime from, OffsetDateTime to, Pageable pageable) {
    if (from != null && to != null && !to.isAfter(from)) {
      throw new IllegalArgumentException("to must be after from");
    }

    Specification<Booking> spec =
        Specification.where(BookingSpecifications.statusEquals(status))
            .and(BookingSpecifications.facilityIdEquals(facilityId))
            .and(BookingSpecifications.overlaps(from, to));
    return bookingRepository.findAll(spec, pageable).map(this::toResponse);
  }

  @Transactional
  public BookingResponse decideBooking(Long bookingId, BookingStatus decisionStatus, String adminUsername) {
    if (decisionStatus != BookingStatus.APPROVED && decisionStatus != BookingStatus.REJECTED) {
      throw new IllegalArgumentException("Only APPROVED or REJECTED decisions are allowed");
    }

    UserAccount admin = getRequiredUser(adminUsername);
    if (admin.getRole() != AppRole.ADMIN) {
      throw new AccessDeniedException("Only admin can decide bookings");
    }

    Booking booking =
        bookingRepository.findById(bookingId).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

    if (booking.getStatus() != BookingStatus.PENDING) {
      throw new IllegalArgumentException("Only PENDING bookings can be updated");
    }

    // Lock the facility row so approval decisions for the same facility are serialized.
    FacilityResource lockedFacility =
        facilityResourceRepository
            .findByIdForUpdate(booking.getFacilityResource().getId())
            .orElseThrow(() -> new ResourceNotFoundException("Facility not found"));

    if (decisionStatus == BookingStatus.APPROVED) {
      if (lockedFacility.isDeleted() || lockedFacility.getStatus() != ResourceStatus.ACTIVE) {
        throw new IllegalArgumentException("Booking cannot be approved for an unavailable facility");
      }
      boolean overlap =
          bookingRepository.existsOverlappingBookingExcluding(
              lockedFacility.getId(),
              BookingStatus.APPROVED,
              booking.getBookedFrom(),
              booking.getBookedTo(),
              booking.getBookingId());
      if (overlap) {
        throw new BookingConflictException("Cannot approve due to an overlapping approved booking.");
      }
      booking.setApprovedAt(OffsetDateTime.now());
    } else {
      booking.setApprovedAt(null);
    }

    booking.setStatus(decisionStatus);
    Booking saved = bookingRepository.save(booking);

    if (decisionStatus == BookingStatus.APPROVED) {
      notificationService.notifyUser(
          saved.getBookedByUser(),
          NotificationType.BOOKING_APPROVED,
          "Booking approved",
          "Your booking for "
              + saved.getFacilityName()
              + " from "
              + saved.getBookedFrom()
              + " to "
              + saved.getBookedTo()
              + " has been confirmed.",
          RelatedEntityType.BOOKING,
          saved.getBookingId(),
          "/bookings",
          admin);
    } else {
      notificationService.notifyUser(
          saved.getBookedByUser(),
          NotificationType.BOOKING_REJECTED,
          "Booking rejected",
          "Your booking request for " + saved.getFacilityName() + " was rejected.",
          RelatedEntityType.BOOKING,
          saved.getBookingId(),
          "/bookings",
          admin);
    }

    return toResponse(saved);
  }

  @Transactional(readOnly = true)
  public long getPendingApprovalCount() {
    return bookingRepository.countByStatus(BookingStatus.PENDING);
  }

  private UserAccount getRequiredUser(String username) {
    return userAccountRepository
        .findByUsername(username)
        .orElseThrow(() -> new ResourceNotFoundException("User account not found"));
  }

  private FacilityResource getActiveFacility(Long facilityId) {
    FacilityResource resource =
        facilityResourceRepository
            .findById(facilityId)
            .orElseThrow(() -> new ResourceNotFoundException("Facility not found"));

    if (resource.isDeleted() || resource.getStatus() != ResourceStatus.ACTIVE) {
      throw new IllegalArgumentException("Facility is not available for booking");
    }
    return resource;
  }

  private void validateBookingRange(OffsetDateTime bookedFrom, OffsetDateTime bookedTo, Integer durationMinutes) {
    if (bookedFrom == null || bookedTo == null || durationMinutes == null) {
      throw new IllegalArgumentException("bookedFrom, bookedTo and durationMinutes are required");
    }
    if (!bookedTo.isAfter(bookedFrom)) {
      throw new IllegalArgumentException("bookedTo must be after bookedFrom");
    }
    long calculatedDuration = Duration.between(bookedFrom, bookedTo).toMinutes();
    if (calculatedDuration != durationMinutes) {
      throw new IllegalArgumentException("durationMinutes must match bookedFrom and bookedTo");
    }
  }

  private String buildFacilityName(FacilityResource resource) {
    return resource.getType().name() + " - " + resource.getLocation();
  }

  private BookingResponse toResponse(Booking booking) {
    BookingResponse response = new BookingResponse();
    response.setBookingId(booking.getBookingId());
    response.setFacilityId(booking.getFacilityResource().getId());
    response.setFacilityName(booking.getFacilityName());
    response.setBookedByUserId(booking.getBookedByUser().getId());
    response.setBookedByUserName(booking.getBookedByUserName());
    response.setPurpose(booking.getPurpose());
    response.setDurationMinutes(booking.getDurationMinutes());
    response.setBookedFrom(booking.getBookedFrom());
    response.setBookedTo(booking.getBookedTo());
    response.setStatus(booking.getStatus());
    response.setCreatedAt(booking.getCreatedAt());
    response.setApprovedAt(booking.getApprovedAt());
    return response;
  }
}
