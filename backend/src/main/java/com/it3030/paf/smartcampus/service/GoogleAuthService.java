package com.it3030.paf.smartcampus.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.it3030.paf.smartcampus.api.dto.AuthSessionResponse;
import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.AuthProvider;
import com.it3030.paf.smartcampus.repository.UserAccountRepository;
import com.it3030.paf.smartcampus.security.AppSecurityProperties;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class GoogleAuthService {

  private static final int USERNAME_MAX_LENGTH = 64;
  private static final int SESSION_PASSWORD_BYTES = 24;

  private final UserAccountRepository userAccountRepository;
  private final PasswordEncoder passwordEncoder;
  private final AppSecurityProperties securityProperties;
  private final RestClient googleApiClient;
  private final SecureRandom secureRandom;

  public GoogleAuthService(
      UserAccountRepository userAccountRepository,
      PasswordEncoder passwordEncoder,
      AppSecurityProperties securityProperties) {
    this.userAccountRepository = userAccountRepository;
    this.passwordEncoder = passwordEncoder;
    this.securityProperties = securityProperties;
    this.googleApiClient = RestClient.builder().baseUrl("https://oauth2.googleapis.com").build();
    this.secureRandom = new SecureRandom();
  }

  @Transactional
  public AuthSessionResponse loginWithGoogle(String idToken) {
    if (!securityProperties.isGoogleEnabled()) {
      throw new IllegalArgumentException("Google login is disabled.");
    }
    String clientId = securityProperties.getGoogleClientId().trim();
    if (clientId.isEmpty()) {
      throw new IllegalArgumentException("Google login is enabled but GOOGLE_CLIENT_ID is missing.");
    }

    GoogleTokenInfo tokenInfo = fetchAndValidateTokenInfo(idToken, clientId);
    String email = tokenInfo.email().trim().toLowerCase(Locale.ROOT);
    UserAccount account = findOrCreateGoogleUser(tokenInfo.subject(), email);

    String sessionPassword = generateSessionPassword();
    account.setPasswordHash(passwordEncoder.encode(sessionPassword));
    UserAccount saved = userAccountRepository.save(account);
    String basicToken = encodeBasicToken(saved.getUsername(), sessionPassword);

    return new AuthSessionResponse(saved.getId(), saved.getUsername(), saved.getRole().name(), basicToken);
  }

  private GoogleTokenInfo fetchAndValidateTokenInfo(String idToken, String expectedClientId) {
    GoogleTokenInfo tokenInfo;
    try {
      tokenInfo =
          googleApiClient
              .get()
              .uri(
                  uriBuilder ->
                      uriBuilder.path("/tokeninfo").queryParam("id_token", idToken).build())
              .retrieve()
              .body(GoogleTokenInfo.class);
    } catch (RestClientException ex) {
      throw new IllegalArgumentException("Invalid Google login token.");
    }

    if (tokenInfo == null) {
      throw new IllegalArgumentException("Invalid Google login token.");
    }
    if (!expectedClientId.equals(tokenInfo.audience())) {
      throw new IllegalArgumentException("Google token audience does not match this application.");
    }
    if (!isSupportedIssuer(tokenInfo.issuer())) {
      throw new IllegalArgumentException("Google token issuer is not valid.");
    }
    if (!isVerifiedEmail(tokenInfo.emailVerified())) {
      throw new IllegalArgumentException("Google account email is not verified.");
    }
    if (tokenInfo.email() == null || tokenInfo.email().isBlank()) {
      throw new IllegalArgumentException("Google account email is unavailable.");
    }
    if (tokenInfo.subject() == null || tokenInfo.subject().isBlank()) {
      throw new IllegalArgumentException("Google account identifier is unavailable.");
    }

    long expSeconds;
    try {
      expSeconds = Long.parseLong(tokenInfo.expiresAt());
    } catch (NumberFormatException ex) {
      throw new IllegalArgumentException("Google token expiry is invalid.");
    }
    if (expSeconds <= Instant.now().getEpochSecond()) {
      throw new IllegalArgumentException("Google login token has expired.");
    }

    return tokenInfo;
  }

  private UserAccount findOrCreateGoogleUser(String googleSub, String email) {
    UserAccount existingBySub = userAccountRepository.findByGoogleSub(googleSub).orElse(null);
    if (existingBySub != null) {
      existingBySub.setEmail(email);
      existingBySub.setAuthProvider(AuthProvider.GOOGLE);
      return existingBySub;
    }

    UserAccount existingGoogleByEmail =
        userAccountRepository
            .findByEmailIgnoreCaseAndAuthProvider(email, AuthProvider.GOOGLE)
            .orElse(null);
    if (existingGoogleByEmail != null) {
      existingGoogleByEmail.setGoogleSub(googleSub);
      return existingGoogleByEmail;
    }

    UserAccount account = new UserAccount();
    account.setUsername(generateUniqueGoogleUsername(email));
    account.setRole(AppRole.STUDENT);
    account.setAuthProvider(AuthProvider.GOOGLE);
    account.setGoogleSub(googleSub);
    account.setEmail(email);
    return account;
  }

  private String generateUniqueGoogleUsername(String email) {
    String normalized = email.trim().toLowerCase(Locale.ROOT);
    if (normalized.length() <= USERNAME_MAX_LENGTH && !userAccountRepository.existsByUsername(normalized)) {
      return normalized;
    }

    String localPart = normalized;
    int atIndex = normalized.indexOf('@');
    if (atIndex > 0) {
      localPart = normalized.substring(0, atIndex);
    }
    localPart = localPart.replaceAll("[^a-z0-9._-]", "");
    if (localPart.isBlank()) {
      localPart = "google_user";
    }

    String suffix = "_g";
    String candidate = shorten(localPart, USERNAME_MAX_LENGTH - suffix.length()) + suffix;
    if (!userAccountRepository.existsByUsername(candidate)) {
      return candidate;
    }

    for (int i = 2; i <= 9999; i++) {
      suffix = "_g" + i;
      candidate = shorten(localPart, USERNAME_MAX_LENGTH - suffix.length()) + suffix;
      if (!userAccountRepository.existsByUsername(candidate)) {
        return candidate;
      }
    }
    throw new IllegalStateException("Unable to allocate username for Google user.");
  }

  private String shorten(String value, int maxLength) {
    if (maxLength <= 0) {
      return "";
    }
    return value.length() <= maxLength ? value : value.substring(0, maxLength);
  }

  private String generateSessionPassword() {
    byte[] bytes = new byte[SESSION_PASSWORD_BYTES];
    secureRandom.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private String encodeBasicToken(String username, String rawPassword) {
    String credentials = username + ":" + rawPassword;
    return Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
  }

  private boolean isSupportedIssuer(String issuer) {
    return "accounts.google.com".equals(issuer) || "https://accounts.google.com".equals(issuer);
  }

  private boolean isVerifiedEmail(String emailVerified) {
    return "true".equalsIgnoreCase(emailVerified) || "1".equals(emailVerified);
  }

  private record GoogleTokenInfo(
      @JsonProperty("aud") String audience,
      @JsonProperty("sub") String subject,
      @JsonProperty("email") String email,
      @JsonProperty("email_verified") String emailVerified,
      @JsonProperty("iss") String issuer,
      @JsonProperty("exp") String expiresAt) {}
}
