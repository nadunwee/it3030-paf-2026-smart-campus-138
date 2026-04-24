package com.it3030.paf.smartcampus.security;

import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.AuthProvider;
import com.it3030.paf.smartcampus.repository.UserAccountRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrapRunner implements ApplicationRunner {

  private final UserAccountRepository userAccountRepository;
  private final PasswordEncoder passwordEncoder;
  private final AppSecurityProperties securityProperties;

  public AdminBootstrapRunner(
      UserAccountRepository userAccountRepository,
      PasswordEncoder passwordEncoder,
      AppSecurityProperties securityProperties) {
    this.userAccountRepository = userAccountRepository;
    this.passwordEncoder = passwordEncoder;
    this.securityProperties = securityProperties;
  }

  @Override
  public void run(ApplicationArguments args) {
    if (userAccountRepository.existsByRole(AppRole.ADMIN)) {
      return;
    }
    String username = securityProperties.getBootstrapAdminUsername().trim();
    if (username.isEmpty()) {
      return;
    }
    if (userAccountRepository.existsByUsername(username)) {
      return;
    }
    UserAccount admin = new UserAccount();
    admin.setUsername(username);
    admin.setPasswordHash(passwordEncoder.encode(securityProperties.getBootstrapAdminPassword()));
    admin.setRole(AppRole.ADMIN);
    admin.setAuthProvider(AuthProvider.LOCAL);
    userAccountRepository.save(admin);
  }
}
