package com.it3030.paf.smartcampus.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.cors")
public class AppCorsProperties {

  private List<String> allowedOriginPatterns =
      new ArrayList<>(
          List.of("http://localhost:*", "http://127.0.0.1:*", "http://[::1]:*", "*"));

  public List<String> getAllowedOriginPatterns() {
    return allowedOriginPatterns;
  }

  public void setAllowedOriginPatterns(List<String> allowedOriginPatterns) {
    this.allowedOriginPatterns = allowedOriginPatterns;
  }
}
