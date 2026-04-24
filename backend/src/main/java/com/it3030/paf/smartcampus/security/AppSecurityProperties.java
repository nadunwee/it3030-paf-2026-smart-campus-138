package com.it3030.paf.smartcampus.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public class AppSecurityProperties {

  /** Initial admin username when no ADMIN exists (override via ADMIN_USERNAME in production). */
  private String bootstrapAdminUsername = "admin";

  /** Initial admin password (use ADMIN_PASSWORD env in production; never commit real secrets). */
  private String bootstrapAdminPassword = "admin123";

  /** Enables Google login endpoint/token exchange. */
  private boolean googleEnabled = false;

  /** Firebase project ID used to verify Firebase Authentication ID tokens. */
  private String firebaseProjectId = "";

  /** Optional service account JSON path. If blank, Application Default Credentials are used. */
  private String firebaseServiceAccountPath = "";

  public String getBootstrapAdminUsername() {
    return bootstrapAdminUsername;
  }

  public void setBootstrapAdminUsername(String bootstrapAdminUsername) {
    this.bootstrapAdminUsername = bootstrapAdminUsername;
  }

  public String getBootstrapAdminPassword() {
    return bootstrapAdminPassword;
  }

  public void setBootstrapAdminPassword(String bootstrapAdminPassword) {
    this.bootstrapAdminPassword = bootstrapAdminPassword;
  }

  public boolean isGoogleEnabled() {
    return googleEnabled;
  }

  public void setGoogleEnabled(boolean googleEnabled) {
    this.googleEnabled = googleEnabled;
  }

  public String getFirebaseProjectId() {
    return firebaseProjectId;
  }

  public void setFirebaseProjectId(String firebaseProjectId) {
    this.firebaseProjectId = firebaseProjectId;
  }

  public String getFirebaseServiceAccountPath() {
    return firebaseServiceAccountPath;
  }

  public void setFirebaseServiceAccountPath(String firebaseServiceAccountPath) {
    this.firebaseServiceAccountPath = firebaseServiceAccountPath;
  }
}
