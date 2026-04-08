package com.it3030.paf.smartcampus.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public class AppSecurityProperties {

  /** Initial admin username when no ADMIN exists (override via ADMIN_USERNAME in production). */
  private String bootstrapAdminUsername = "admin";

  /** Initial admin password (use ADMIN_PASSWORD env in production; never commit real secrets). */
  private String bootstrapAdminPassword = "admin123";

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
}
