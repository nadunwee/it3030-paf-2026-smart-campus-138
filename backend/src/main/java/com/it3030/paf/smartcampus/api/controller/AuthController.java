package com.it3030.paf.smartcampus.api.controller;

import com.it3030.paf.smartcampus.api.dto.MeResponse;
import com.it3030.paf.smartcampus.api.dto.GoogleLoginRequest;
import com.it3030.paf.smartcampus.api.dto.GoogleLoginResponse;
import com.it3030.paf.smartcampus.api.dto.RegisterRequest;
import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.exception.DuplicateUsernameException;
import com.it3030.paf.smartcampus.repository.UserAccountRepository;
import com.it3030.paf.smartcampus.security.AppSecurityProperties;
import com.it3030.paf.smartcampus.service.GoogleTokenVerifier;
import jakarta.validation.Valid;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private final UserAccountRepository userAccountRepository;
  private final PasswordEncoder passwordEncoder;
  private final AppSecurityProperties securityProperties;
  private final GoogleTokenVerifier googleTokenVerifier;
  private static final SecureRandom SECURE_RANDOM = new SecureRandom();

  public AuthController(
      UserAccountRepository userAccountRepository,
      PasswordEncoder passwordEncoder,
      AppSecurityProperties securityProperties,
      GoogleTokenVerifier googleTokenVerifier) {
    this.userAccountRepository = userAccountRepository;
    this.passwordEncoder = passwordEncoder;
    this.securityProperties = securityProperties;
    this.googleTokenVerifier = googleTokenVerifier;
  }

  @PostMapping("/register")
  public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequest request) {
    String username = request.getUsername().trim();
    if (username.isEmpty()) {
      throw new IllegalArgumentException("Username cannot be blank");
    }
    if (username.equalsIgnoreCase(securityProperties.getBootstrapAdminUsername().trim())) {
      throw new IllegalArgumentException("This username is reserved for system administration");
    }
    if (userAccountRepository.existsByUsername(username)) {
      throw new DuplicateUsernameException();
    }
    UserAccount account = new UserAccount();
    account.setUsername(username);
    account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    account.setRole(AppRole.USER);
    userAccountRepository.save(account);
    return ResponseEntity.status(HttpStatus.CREATED).build();
  }

  @GetMapping("/me")
  public MeResponse me(Authentication authentication) {
    boolean admin =
        authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch("ROLE_ADMIN"::equals);
    return new MeResponse(authentication.getName(), admin ? "ADMIN" : "USER");
  }

  @PostMapping("/google")
  public GoogleLoginResponse googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
    GoogleTokenVerifier.GoogleTokenInfo info = googleTokenVerifier.verify(request.getIdToken());
    String configuredClientId = securityProperties.getGoogleClientId().trim();
    if (!configuredClientId.isEmpty() && !configuredClientId.equals(info.audience())) {
      throw new IllegalArgumentException("Google token audience does not match this application.");
    }

    UserAccount account =
        userAccountRepository
            .findByUsername(info.email())
            .orElseGet(
                () -> {
                  UserAccount created = new UserAccount();
                  created.setUsername(info.email());
                  created.setRole(AppRole.USER);
                  return created;
                });

    String temporaryPassword = issueTemporaryPassword();
    account.setPasswordHash(passwordEncoder.encode(temporaryPassword));
    UserAccount saved = userAccountRepository.save(account);

    return new GoogleLoginResponse(
        saved.getUsername(),
        temporaryPassword,
        saved.getRole() == AppRole.ADMIN ? "ADMIN" : "USER");
  }

  private static String issueTemporaryPassword() {
    byte[] bytes = new byte[24];
    SECURE_RANDOM.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }
}
