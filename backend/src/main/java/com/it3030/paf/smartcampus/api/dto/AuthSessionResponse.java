package com.it3030.paf.smartcampus.api.dto;

public class AuthSessionResponse {
  private Long id;
  private String username;
  private String role;
  private String basicToken;

  public AuthSessionResponse() {}

  public AuthSessionResponse(Long id, String username, String role, String basicToken) {
    this.id = id;
    this.username = username;
    this.role = role;
    this.basicToken = basicToken;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getRole() {
    return role;
  }

  public void setRole(String role) {
    this.role = role;
  }

  public String getBasicToken() {
    return basicToken;
  }

  public void setBasicToken(String basicToken) {
    this.basicToken = basicToken;
  }
}
