package com.it3030.paf.smartcampus.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.it3030.paf.smartcampus.api.dto.AuthSessionResponse;
import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.AuthProvider;
import com.it3030.paf.smartcampus.repository.UserAccountRepository;
import com.it3030.paf.smartcampus.security.AppSecurityProperties;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Locale;
import java.util.Map;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GoogleAuthService {

  private static final String FIREBASE_APP_NAME = "smart-campus-auth";
  private static final int USERNAME_MAX_LENGTH = 64;
  private static final int SESSION_PASSWORD_BYTES = 24;

  private final UserAccountRepository userAccountRepository;
  private final PasswordEncoder passwordEncoder;
  private final AppSecurityProperties securityProperties;
  private final SecureRandom secureRandom;
  private FirebaseAuth firebaseAuth;

  public GoogleAuthService(
      UserAccountRepository userAccountRepository,
      PasswordEncoder passwordEncoder,
      AppSecurityProperties securityProperties) {
    this.userAccountRepository = userAccountRepository;
    this.passwordEncoder = passwordEncoder;
    this.securityProperties = securityProperties;
    this.secureRandom = new SecureRandom();
  }

  @Transactional
  public AuthSessionResponse loginWithGoogle(String idToken) {
    if (!securityProperties.isGoogleEnabled()) {
      throw new IllegalArgumentException("Google login is disabled.");
    }

    FirebaseToken token = verifyFirebaseToken(idToken);
    if (!isGoogleSignInProvider(token)) {
      throw new IllegalArgumentException("Firebase token was not issued by Google sign-in.");
    }
    if (!token.isEmailVerified()) {
      throw new IllegalArgumentException("Google account email is not verified.");
    }
    if (token.getEmail() == null || token.getEmail().isBlank()) {
      throw new IllegalArgumentException("Google account email is unavailable.");
    }
    if (token.getUid() == null || token.getUid().isBlank()) {
      throw new IllegalArgumentException("Firebase account identifier is unavailable.");
    }

    String email = token.getEmail().trim().toLowerCase(Locale.ROOT);
    UserAccount account = findOrCreateGoogleUser(token.getUid(), email);

    String sessionPassword = generateSessionPassword();
    account.setPasswordHash(passwordEncoder.encode(sessionPassword));
    UserAccount saved = userAccountRepository.save(account);
    String basicToken = encodeBasicToken(saved.getUsername(), sessionPassword);

    return new AuthSessionResponse(saved.getId(), saved.getUsername(), saved.getRole().name(), basicToken);
  }

  private FirebaseToken verifyFirebaseToken(String idToken) {
    try {
      return getFirebaseAuth().verifyIdToken(idToken);
    } catch (FirebaseAuthException ex) {
      throw new IllegalArgumentException("Invalid Firebase login token.");
    }
  }

  private boolean isGoogleSignInProvider(FirebaseToken token) {
    Object firebaseClaim = token.getClaims().get("firebase");
    if (!(firebaseClaim instanceof Map<?, ?> firebaseClaims)) {
      return false;
    }
    return "google.com".equals(firebaseClaims.get("sign_in_provider"));
  }

  private UserAccount findOrCreateGoogleUser(String firebaseUid, String email) {
    UserAccount existingBySub = userAccountRepository.findByGoogleSub(firebaseUid).orElse(null);
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
      existingGoogleByEmail.setGoogleSub(firebaseUid);
      return existingGoogleByEmail;
    }

    UserAccount account = new UserAccount();
    account.setUsername(generateUniqueGoogleUsername(email));
    account.setRole(AppRole.STUDENT);
    account.setAuthProvider(AuthProvider.GOOGLE);
    account.setGoogleSub(firebaseUid);
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

  private FirebaseAuth getFirebaseAuth() {
    if (firebaseAuth != null) {
      return firebaseAuth;
    }
    synchronized (this) {
      if (firebaseAuth == null) {
        firebaseAuth = FirebaseAuth.getInstance(getOrCreateFirebaseApp());
      }
      return firebaseAuth;
    }
  }

  private FirebaseApp getOrCreateFirebaseApp() {
    return FirebaseApp.getApps().stream()
        .filter(app -> FIREBASE_APP_NAME.equals(app.getName()))
        .findFirst()
        .orElseGet(this::initializeFirebaseApp);
  }

  private FirebaseApp initializeFirebaseApp() {
    String projectId = securityProperties.getFirebaseProjectId().trim();
    if (projectId.isEmpty()) {
      throw new IllegalArgumentException("Google login is enabled but FIREBASE_PROJECT_ID is missing.");
    }

    try {
      FirebaseOptions options =
          FirebaseOptions.builder()
              .setProjectId(projectId)
              .setCredentials(loadFirebaseCredentials())
              .build();
      return FirebaseApp.initializeApp(options, FIREBASE_APP_NAME);
    } catch (IOException ex) {
      throw new IllegalArgumentException(
          "Firebase credentials are missing or invalid. Set FIREBASE_SERVICE_ACCOUNT_PATH or Application Default Credentials.");
    }
  }

  private GoogleCredentials loadFirebaseCredentials() throws IOException {
    String serviceAccountPath = securityProperties.getFirebaseServiceAccountPath().trim();
    if (serviceAccountPath.isEmpty()) {
      return GoogleCredentials.getApplicationDefault();
    }

    File serviceAccountFile = new File(serviceAccountPath);
    if (!serviceAccountFile.isFile()) {
      throw new IllegalArgumentException(
          "Firebase service account JSON was not found at " + serviceAccountFile.getAbsolutePath() + ".");
    }

    try (InputStream serviceAccount = new FileInputStream(serviceAccountFile)) {
      return GoogleCredentials.fromStream(serviceAccount);
    }
  }
}
