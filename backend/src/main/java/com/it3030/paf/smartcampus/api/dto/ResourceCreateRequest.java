package com.it3030.paf.smartcampus.api.dto;

import com.it3030.paf.smartcampus.domain.enums.ResourceStatus;
import com.it3030.paf.smartcampus.domain.enums.ResourceType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public class ResourceCreateRequest {

  @NotNull(message = "type is required")
  private ResourceType type;

  @NotNull(message = "capacity is required")
  private Integer capacity;

  @NotBlank(message = "location is required")
  @Size(max = 255)
  private String location;

  @NotNull(message = "status is required")
  private ResourceStatus status;

  @Valid
  private List<AvailabilityWindowRequest> availabilityWindows;

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

