package com.it3030.paf.smartcampus.api.dto;

import com.it3030.paf.smartcampus.domain.enums.AppRole;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AdminUserCreateRequest {

  @NotBlank(message = "username is required")
  @Size(min = 3, max = 64, message = "username must be between 3 and 64 characters")
  private String username;

  @NotBlank(message = "password is required")
  @Size(min = 8, max = 128, message = "password must be between 8 and 128 characters")
  private String password;

  @NotNull(message = "role is required")
  private AppRole role;

  @AssertTrue(message = "role must be STUDENT or TEACHER")
  public boolean isAllowedRole() {
    return role == null || role == AppRole.STUDENT || role == AppRole.TEACHER;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public AppRole getRole() {
    return role;
  }

  public void setRole(AppRole role) {
    this.role = role;
  }
}
