package com.it3030.paf.smartcampus.domain;

import com.it3030.paf.smartcampus.domain.enums.ResourceStatus;
import com.it3030.paf.smartcampus.domain.enums.ResourceType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "facility_resources")
public class FacilityResource {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Enumerated(EnumType.STRING)
  @Column(name = "type", nullable = false, length = 64)
  private ResourceType type;

  @Column(name = "capacity", nullable = false)
  private Integer capacity;

  @Column(name = "location", nullable = false, length = 255)
  private String location;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 64)
  private ResourceStatus status;

  @Column(name = "deleted", nullable = false)
  private boolean deleted = false;

  @OneToMany(mappedBy = "resource", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
  private List<AvailabilityWindow> availabilityWindows = new ArrayList<>();

  public Long getId() {
    return id;
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

  public boolean isDeleted() {
    return deleted;
  }

  public void setDeleted(boolean deleted) {
    this.deleted = deleted;
  }

  public List<AvailabilityWindow> getAvailabilityWindows() {
    return availabilityWindows;
  }

  public void setAvailabilityWindows(List<AvailabilityWindow> availabilityWindows) {
    this.availabilityWindows = availabilityWindows;
  }
}

