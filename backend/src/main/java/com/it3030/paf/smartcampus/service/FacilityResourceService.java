package com.it3030.paf.smartcampus.service;

import com.it3030.paf.smartcampus.api.dto.AvailabilityWindowRequest;
import com.it3030.paf.smartcampus.api.dto.AvailabilityWindowResponse;
import com.it3030.paf.smartcampus.api.dto.ResourceCreateRequest;
import com.it3030.paf.smartcampus.api.dto.ResourcePatchRequest;
import com.it3030.paf.smartcampus.api.dto.ResourceResponse;
import com.it3030.paf.smartcampus.domain.AvailabilityWindow;
import com.it3030.paf.smartcampus.domain.FacilityResource;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.NotificationType;
import com.it3030.paf.smartcampus.domain.enums.RelatedEntityType;
import com.it3030.paf.smartcampus.domain.enums.ResourceStatus;
import com.it3030.paf.smartcampus.domain.enums.ResourceType;
import com.it3030.paf.smartcampus.exception.ResourceNotFoundException;
import com.it3030.paf.smartcampus.repository.FacilityResourceRepository;
import com.it3030.paf.smartcampus.repository.FacilityResourceSpecifications;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FacilityResourceService {

  private final FacilityResourceRepository facilityResourceRepository;
  private final NotificationService notificationService;

  public FacilityResourceService(
      FacilityResourceRepository facilityResourceRepository,
      NotificationService notificationService) {
    this.facilityResourceRepository = facilityResourceRepository;
    this.notificationService = notificationService;
  }

  @Transactional(readOnly = true)
  public Page<ResourceResponse> searchResources(
      ResourceType type,
      Integer capacityMin,
      String location,
      ResourceStatus status,
      OffsetDateTime availableOn,
      OffsetDateTime availableFrom,
      OffsetDateTime availableTo,
      Pageable pageable,
      boolean isAdmin
  ) {
    if ((availableFrom == null) != (availableTo == null)) {
      throw new IllegalArgumentException("availableFrom and availableTo must be provided together");
    }
    if (availableFrom != null && !availableTo.isAfter(availableFrom)) {
      throw new IllegalArgumentException("availableTo must be after availableFrom");
    }

    // Non-admin users should only see ACTIVE resources.
    ResourceStatus effectiveStatus = isAdmin ? status : ResourceStatus.ACTIVE;

    Specification<FacilityResource> spec =
        Specification.where(FacilityResourceSpecifications.notDeleted())
            .and(FacilityResourceSpecifications.typeEquals(type))
            .and(FacilityResourceSpecifications.locationContains(location))
            .and(FacilityResourceSpecifications.capacityAtLeast(capacityMin))
            .and(FacilityResourceSpecifications.statusEquals(effectiveStatus))
            .and(FacilityResourceSpecifications.availableOn(availableOn))
            .and(FacilityResourceSpecifications.notBookedBetween(availableFrom, availableTo));

    return facilityResourceRepository.findAll(spec, pageable).map(this::toResponse);
  }

  @Transactional(readOnly = true)
  public ResourceResponse getById(Long id, boolean isAdmin) {
    FacilityResource entity =
        facilityResourceRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

    if (entity.isDeleted()) {
      throw new ResourceNotFoundException("Resource not found");
    }
    if (!isAdmin && entity.getStatus() != ResourceStatus.ACTIVE) {
      throw new ResourceNotFoundException("Resource not found");
    }
    return toResponse(entity);
  }

  @Transactional
  public ResourceResponse create(ResourceCreateRequest request) {
    FacilityResource entity = new FacilityResource();
    entity.setType(request.getType());
    entity.setCapacity(request.getCapacity());
    entity.setLocation(request.getLocation().trim());
    entity.setStatus(request.getStatus());
    entity.setDeleted(false);

    if (request.getAvailabilityWindows() != null) {
      for (AvailabilityWindowRequest windowReq : request.getAvailabilityWindows()) {
        AvailabilityWindow window = new AvailabilityWindow();
        window.setStartDateTime(windowReq.getStartDateTime());
        window.setEndDateTime(windowReq.getEndDateTime());
        window.setResource(entity);
        entity.getAvailabilityWindows().add(window);
      }
    }

    FacilityResource saved = facilityResourceRepository.save(entity);
    notificationService.notifyUsersByRole(
        AppRole.STUDENT,
        NotificationType.SYSTEM,
        "New facility added",
        "A new facility is available: " + saved.getType().name() + " at " + saved.getLocation() + ".",
        RelatedEntityType.SYSTEM,
        saved.getId(),
        "/facilities/" + saved.getId(),
        null);
    notificationService.notifyUsersByRole(
        AppRole.TEACHER,
        NotificationType.SYSTEM,
        "New facility added",
        "A new facility is available: " + saved.getType().name() + " at " + saved.getLocation() + ".",
        RelatedEntityType.SYSTEM,
        saved.getId(),
        "/facilities/" + saved.getId(),
        null);
    return toResponse(saved);
  }

  @Transactional
  public ResourceResponse patch(Long id, ResourcePatchRequest request) {
    FacilityResource entity =
        facilityResourceRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

    if (entity.isDeleted()) {
      throw new ResourceNotFoundException("Resource not found");
    }

    if (request.getType() != null) {
      entity.setType(request.getType());
    }
    if (request.getCapacity() != null) {
      entity.setCapacity(request.getCapacity());
    }
    if (request.getLocation() != null) {
      entity.setLocation(request.getLocation().trim());
    }
    if (request.getStatus() != null) {
      entity.setStatus(request.getStatus());
    }
    if (request.getAvailabilityWindows() != null) {
      // Replace windows entirely when the client provides the field.
      entity.getAvailabilityWindows().clear();
      for (AvailabilityWindowRequest windowReq : request.getAvailabilityWindows()) {
        AvailabilityWindow window = new AvailabilityWindow();
        window.setStartDateTime(windowReq.getStartDateTime());
        window.setEndDateTime(windowReq.getEndDateTime());
        window.setResource(entity);
        entity.getAvailabilityWindows().add(window);
      }
    }

    FacilityResource saved = facilityResourceRepository.save(entity);
    return toResponse(saved);
  }

  @Transactional
  public void softDelete(Long id) {
    FacilityResource entity =
        facilityResourceRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

    if (entity.isDeleted()) {
      throw new ResourceNotFoundException("Resource not found");
    }

    entity.setDeleted(true);
    facilityResourceRepository.save(entity);
  }

  private ResourceResponse toResponse(FacilityResource entity) {
    ResourceResponse response = new ResourceResponse();
    response.setId(entity.getId());
    response.setType(entity.getType());
    response.setCapacity(entity.getCapacity());
    response.setLocation(entity.getLocation());
    response.setStatus(entity.getStatus());

    List<AvailabilityWindowResponse> windows;
    if (entity.getAvailabilityWindows() == null) {
      windows = Collections.emptyList();
    } else {
      windows =
          entity.getAvailabilityWindows().stream()
              .map(this::toWindowResponse)
              .toList();
    }
    response.setAvailabilityWindows(windows);
    return response;
  }

  private AvailabilityWindowResponse toWindowResponse(AvailabilityWindow window) {
    AvailabilityWindowResponse res = new AvailabilityWindowResponse();
    res.setStartDateTime(window.getStartDateTime());
    res.setEndDateTime(window.getEndDateTime());
    return res;
  }
}
