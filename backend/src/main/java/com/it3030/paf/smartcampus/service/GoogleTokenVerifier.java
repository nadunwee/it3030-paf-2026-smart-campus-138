package com.it3030.paf.smartcampus.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Service;

@Service
public class GoogleTokenVerifier {

  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;

  public GoogleTokenVerifier(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
    this.httpClient = HttpClient.newHttpClient();
  }

  public GoogleTokenInfo verify(String idToken) {
    try {
      String url =
          "https://oauth2.googleapis.com/tokeninfo?id_token="
              + URLEncoder.encode(idToken, StandardCharsets.UTF_8);
      HttpRequest request = HttpRequest.newBuilder(URI.create(url)).GET().build();
      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() != 200) {
        throw new IllegalArgumentException("Google token is invalid.");
      }

      JsonNode node = objectMapper.readTree(response.body());
      String audience = node.path("aud").asText("");
      String email = node.path("email").asText("");
      String subject = node.path("sub").asText("");
      boolean emailVerified = "true".equalsIgnoreCase(node.path("email_verified").asText(""));

      if (email.isBlank() || subject.isBlank() || !emailVerified) {
        throw new IllegalArgumentException("Google account must provide a verified email.");
      }

      return new GoogleTokenInfo(audience, email, subject);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Unable to verify Google token right now.", e);
    } catch (IOException e) {
      throw new IllegalStateException("Unable to verify Google token right now.", e);
    }
  }

  public record GoogleTokenInfo(String audience, String email, String subject) {}
}
