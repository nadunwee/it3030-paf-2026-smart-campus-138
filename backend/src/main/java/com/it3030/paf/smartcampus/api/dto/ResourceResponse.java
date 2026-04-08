package com.it3030.paf.smartcampus.api.dto;

import com.it3030.paf.smartcampus.domain.enums.ResourceStatus;
import com.it3030.paf.smartcampus.domain.enums.ResourceType;
import java.util.List;

public class ResourceResponse {
  private Long id;
  private ResourceType type;
  private Integer capacity;
  private String location;
  private ResourceStatus status;
  private List<AvailabilityWindowResponse> availabilityWindows;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
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

  public List<AvailabilityWindowResponse> getAvailabilityWindows() {
    return availabilityWindows;
  }

  public void setAvailabilityWindows(List<AvailabilityWindowResponse> availabilityWindows) {
    this.availabilityWindows = availabilityWindows;
  }
}

