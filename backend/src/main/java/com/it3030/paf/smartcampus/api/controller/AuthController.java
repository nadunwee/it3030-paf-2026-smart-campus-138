package com.it3030.paf.smartcampus.api.controller;

import com.it3030.paf.smartcampus.api.dto.MeResponse;
import com.it3030.paf.smartcampus.api.dto.RegisterRequest;
import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.exception.DuplicateUsernameException;
import com.it3030.paf.smartcampus.repository.UserAccountRepository;
import com.it3030.paf.smartcampus.security.AppSecurityProperties;
import jakarta.validation.Valid;
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

  public AuthController(
      UserAccountRepository userAccountRepository,
      PasswordEncoder passwordEncoder,
      AppSecurityProperties securityProperties) {
    this.userAccountRepository = userAccountRepository;
    this.passwordEncoder = passwordEncoder;
    this.securityProperties = securityProperties;
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
    UserAccount account =
        userAccountRepository
            .findByUsername(authentication.getName())
            .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));
    boolean admin =
        authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch("ROLE_ADMIN"::equals);
    return new MeResponse(account.getId(), account.getUsername(), admin ? "ADMIN" : "USER");
  }
}
