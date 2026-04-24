package com.it3030.paf.smartcampus.api.controller;

import com.it3030.paf.smartcampus.api.dto.AdminUserCreateRequest;
import com.it3030.paf.smartcampus.api.dto.UserRoleUpdateRequest;
import com.it3030.paf.smartcampus.api.dto.UserSummaryResponse;
import com.it3030.paf.smartcampus.service.UserManagementService;
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
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

  private static final int MAX_PAGE_SIZE = 100;

  private final UserManagementService userManagementService;

  public AdminUserController(UserManagementService userManagementService) {
    this.userManagementService = userManagementService;
  }

  @GetMapping
  public ResponseEntity<Page<UserSummaryResponse>> listUsers(
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "20", name = "size") int size) {
    validatePage(page, size);
    PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "id"));
    return ResponseEntity.ok(userManagementService.listUsers(pageable));
  }

  @GetMapping("/{id}")
  public ResponseEntity<UserSummaryResponse> getUser(@PathVariable("id") Long userId) {
    return ResponseEntity.ok(userManagementService.getUser(userId));
  }

  @PostMapping
  public ResponseEntity<UserSummaryResponse> createUser(
      @Valid @RequestBody AdminUserCreateRequest request,
      Authentication authentication) {
    UserSummaryResponse created =
        userManagementService.createUser(
            request.getUsername(),
            request.getPassword(),
            request.getRole(),
            authentication.getName());
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @PatchMapping("/{id}/role")
  public ResponseEntity<UserSummaryResponse> updateRole(
      @PathVariable("id") Long userId,
      @Valid @RequestBody UserRoleUpdateRequest request,
      Authentication authentication) {
    UserSummaryResponse updated =
        userManagementService.updateUserRole(userId, request.getRole(), authentication.getName());
    return ResponseEntity.ok(updated);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteUser(
      @PathVariable("id") Long userId,
      Authentication authentication) {
    userManagementService.deleteUser(userId, authentication.getName());
    return ResponseEntity.noContent().build();
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
