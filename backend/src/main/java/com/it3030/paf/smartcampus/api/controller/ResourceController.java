package com.it3030.paf.smartcampus.api.controller;

import com.it3030.paf.smartcampus.api.dto.ResourceCreateRequest;
import com.it3030.paf.smartcampus.api.dto.ResourcePatchRequest;
import com.it3030.paf.smartcampus.api.dto.ResourceResponse;
import com.it3030.paf.smartcampus.domain.enums.ResourceStatus;
import com.it3030.paf.smartcampus.domain.enums.ResourceType;
import com.it3030.paf.smartcampus.service.FacilityResourceService;
import jakarta.validation.Valid;
import java.time.OffsetDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
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
@RequestMapping("/api/v1/resources")
public class ResourceController {

  private static final int MAX_PAGE_SIZE = 50;

  private final FacilityResourceService facilityResourceService;

  public ResourceController(FacilityResourceService facilityResourceService) {
    this.facilityResourceService = facilityResourceService;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
  public ResponseEntity<Page<ResourceResponse>> list(
      @RequestParam(required = false, name = "type") ResourceType type,
      @RequestParam(required = false, name = "capacityMin") Integer capacityMin,
      @RequestParam(required = false, name = "location") String location,
      @RequestParam(required = false, name = "status") ResourceStatus status,
      @RequestParam(required = false, name = "availableOn")
          @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime availableOn,
      @RequestParam(required = false, name = "availableFrom")
          @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime availableFrom,
      @RequestParam(required = false, name = "availableTo")
          @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime availableTo,
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "20", name = "size") int size,
      Authentication authentication
  ) {
    if (page < 0) {
      throw new IllegalArgumentException("page must be >= 0");
    }
    if (size < 1 || size > MAX_PAGE_SIZE) {
      throw new IllegalArgumentException("size must be between 1 and " + MAX_PAGE_SIZE);
    }

    boolean isAdmin = isAdmin(authentication);
    PageRequest pageable = PageRequest.of(page, size);
    Page<ResourceResponse> result =
        facilityResourceService.searchResources(
            type,
            capacityMin,
            location,
            status,
            availableOn,
            availableFrom,
            availableTo,
            pageable,
            isAdmin);
    return ResponseEntity.ok(result);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
  public ResponseEntity<ResourceResponse> getById(@PathVariable("id") Long id, Authentication authentication) {
    boolean isAdmin = isAdmin(authentication);
    return ResponseEntity.ok(facilityResourceService.getById(id, isAdmin));
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<ResourceResponse> create(
      @Valid @RequestBody ResourceCreateRequest request
  ) {
    ResourceResponse created = facilityResourceService.create(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @PatchMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<ResourceResponse> patch(
      @PathVariable("id") Long id,
      @Valid @RequestBody ResourcePatchRequest request
  ) {
    ResourceResponse updated = facilityResourceService.patch(id, request);
    return ResponseEntity.ok(updated);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
    facilityResourceService.softDelete(id);
    return ResponseEntity.noContent().build();
  }

  private boolean isAdmin(Authentication authentication) {
    if (authentication == null || authentication.getAuthorities() == null) {
      return false;
    }
    return authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
  }
}
