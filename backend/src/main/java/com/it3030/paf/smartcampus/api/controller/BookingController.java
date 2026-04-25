package com.it3030.paf.smartcampus.api.controller;

import com.it3030.paf.smartcampus.api.dto.BookingCreateRequest;
import com.it3030.paf.smartcampus.api.dto.BookingDecisionRequest;
import com.it3030.paf.smartcampus.api.dto.BookingResponse;
import com.it3030.paf.smartcampus.api.dto.PendingCountResponse;
import com.it3030.paf.smartcampus.domain.enums.BookingStatus;
import com.it3030.paf.smartcampus.service.BookingService;
import jakarta.validation.Valid;
import java.time.OffsetDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

  private static final int MAX_PAGE_SIZE = 50;

  private final BookingService bookingService;

  public BookingController(BookingService bookingService) {
    this.bookingService = bookingService;
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
  public ResponseEntity<BookingResponse> createBooking(
      @Valid @RequestBody BookingCreateRequest request, Authentication authentication) {
    BookingResponse created = bookingService.createBooking(request, authentication.getName());
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @GetMapping("/my")
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
  public ResponseEntity<Page<BookingResponse>> myBookings(
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "20", name = "size") int size,
      Authentication authentication) {
    validatePage(page, size);
    PageRequest pageable = PageRequest.of(page, size);
    return ResponseEntity.ok(bookingService.getMyBookings(authentication.getName(), pageable));
  }

  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<Page<BookingResponse>> allBookings(
      @RequestParam(required = false, name = "status") BookingStatus status,
      @RequestParam(required = false, name = "facilityId") Long facilityId,
      @RequestParam(required = false, name = "from")
          @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
      @RequestParam(required = false, name = "to")
          @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "20", name = "size") int size) {
    validatePage(page, size);
    PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    return ResponseEntity.ok(bookingService.getAllBookings(status, facilityId, from, to, pageable));
  }

  @PatchMapping("/{id}/decision")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<BookingResponse> decideBooking(
      @PathVariable("id") Long bookingId,
      @Valid @RequestBody BookingDecisionRequest request,
      Authentication authentication) {
    BookingResponse response = bookingService.decideBooking(bookingId, request.getStatus(), authentication.getName());
    return ResponseEntity.ok(response);
  }

  @PostMapping("/{id}/cancel")
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
  public ResponseEntity<BookingResponse> cancelBooking(
      @PathVariable("id") Long bookingId,
      Authentication authentication) {
    BookingResponse response = bookingService.cancelBooking(bookingId, authentication.getName());
    return ResponseEntity.ok(response);
  }

  @GetMapping("/pending/count")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<PendingCountResponse> pendingCount() {
    return ResponseEntity.ok(new PendingCountResponse(bookingService.getPendingApprovalCount()));
  }

  private void validatePage(int page, int size) {
    if (page < 0) {
      throw new IllegalArgumentException("page must be >= 0");
    }
    if (size < 1 || size > MAX_PAGE_SIZE) {
      throw new IllegalArgumentException("size must be between 1 and " + MAX_PAGE_SIZE);
    }
  }
}
