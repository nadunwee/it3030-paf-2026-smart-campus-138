package com.it3030.paf.smartcampus.api.dto;

import com.it3030.paf.smartcampus.domain.enums.ResourceStatus;
import com.it3030.paf.smartcampus.domain.enums.ResourceType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.List;

public class ResourcePatchRequest {

  private ResourceType type;

  @Min(value = 1, message = "capacity must be >= 1")
  private Integer capacity;

  @Size(max = 255, message = "location must be <= 255 characters")
  private String location;

  private ResourceStatus status;

  @Valid
  private List<AvailabilityWindowRequest> availabilityWindows;

  @AssertTrue(message = "location must be non-blank when provided")
  public boolean isLocationNonBlank() {
    if (location == null) {
      return true;
    }
    return !location.trim().isEmpty();
  }

  public ResourceType getType() {
    return type;
  }

  public void setType(ResourceType type) {
    this.type = type;
  }

  public Integer getCapacity() {
    return capacity;
  }

  public void setCapacity(Integer capacity) {
    this.capacity = capacity;
  }

  public String getLocation() {
    return location;
  }

  public void setLocation(String location) {
    this.location = location;
  }

  public ResourceStatus getStatus() {
    return status;
  }

  public void setStatus(ResourceStatus status) {
    this.status = status;
  }

  public List<AvailabilityWindowRequest> getAvailabilityWindows() {
    return availabilityWindows;
  }

  public void setAvailabilityWindows(List<AvailabilityWindowRequest> availabilityWindows) {
    this.availabilityWindows = availabilityWindows;
  }
}

