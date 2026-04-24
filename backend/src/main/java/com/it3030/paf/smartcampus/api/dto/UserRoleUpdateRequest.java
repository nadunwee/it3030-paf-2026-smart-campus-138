package com.it3030.paf.smartcampus.api.dto;

import com.it3030.paf.smartcampus.domain.enums.AppRole;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

public class UserRoleUpdateRequest {

  @NotNull(message = "role is required")
  private AppRole role;

  @AssertTrue(message = "role must be STUDENT or TEACHER")
  public boolean isValidRole() {
    return role == null || role == AppRole.STUDENT || role == AppRole.TEACHER;
  }

  public AppRole getRole() {
    return role;
  }

  public void setRole(AppRole role) {
    this.role = role;
  }
}
