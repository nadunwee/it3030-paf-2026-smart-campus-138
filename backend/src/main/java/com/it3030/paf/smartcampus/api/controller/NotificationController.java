package com.it3030.paf.smartcampus.api.controller;

import com.it3030.paf.smartcampus.api.dto.BulkActionCountResponse;
import com.it3030.paf.smartcampus.api.dto.NotificationCreateRequest;
import com.it3030.paf.smartcampus.api.dto.NotificationResponse;
import com.it3030.paf.smartcampus.api.dto.NotificationUnreadCountResponse;
import com.it3030.paf.smartcampus.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

  private static final int MAX_PAGE_SIZE = 50;

  private final NotificationService notificationService;

  public NotificationController(NotificationService notificationService) {
    this.notificationService = notificationService;
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<NotificationResponse> createNotification(
      @Valid @RequestBody NotificationCreateRequest request,
      Authentication authentication) {
    NotificationResponse response = notificationService.createNotification(request, authentication.getName());
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
  public ResponseEntity<Page<NotificationResponse>> listMyNotifications(
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size,
      Authentication authentication) {
    validatePage(page, size);
    PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    return ResponseEntity.ok(notificationService.listMyNotifications(authentication.getName(), pageable));
  }

  @GetMapping("/unread/count")
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
  public ResponseEntity<NotificationUnreadCountResponse> unreadCount(Authentication authentication) {
    long unreadCount = notificationService.unreadCount(authentication.getName());
    return ResponseEntity.ok(new NotificationUnreadCountResponse(unreadCount));
  }

  @PatchMapping("/{id}/read")
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
  public ResponseEntity<NotificationResponse> markRead(
      @PathVariable("id") Long notificationId,
      Authentication authentication) {
    return ResponseEntity.ok(notificationService.markAsRead(notificationId, authentication.getName()));
  }

  @PatchMapping("/read-all")
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
  public ResponseEntity<BulkActionCountResponse> markAllRead(Authentication authentication) {
    long updated = notificationService.markAllAsRead(authentication.getName());
    return ResponseEntity.ok(new BulkActionCountResponse(updated));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
  public ResponseEntity<Void> deleteOne(
      @PathVariable("id") Long notificationId,
      Authentication authentication) {
    notificationService.deleteOne(notificationId, authentication.getName());
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
  public ResponseEntity<BulkActionCountResponse> clearAll(Authentication authentication) {
    long removed = notificationService.clearAll(authentication.getName());
    return ResponseEntity.ok(new BulkActionCountResponse(removed));
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
