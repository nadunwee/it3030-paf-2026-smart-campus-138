package com.it3030.paf.smartcampus.service;

import com.it3030.paf.smartcampus.api.dto.UserSummaryResponse;
import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.AuthProvider;
import com.it3030.paf.smartcampus.exception.DuplicateUsernameException;
import com.it3030.paf.smartcampus.exception.ResourceNotFoundException;
import com.it3030.paf.smartcampus.repository.BookingRepository;
import com.it3030.paf.smartcampus.repository.TicketMessageRepository;
import com.it3030.paf.smartcampus.repository.TicketingRepository;
import com.it3030.paf.smartcampus.repository.UserAccountRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserManagementService {

  private final UserAccountRepository userAccountRepository;
  private final BookingRepository bookingRepository;
  private final TicketingRepository ticketingRepository;
  private final TicketMessageRepository ticketMessageRepository;
  private final PasswordEncoder passwordEncoder;

  public UserManagementService(
      UserAccountRepository userAccountRepository,
      BookingRepository bookingRepository,
      TicketingRepository ticketingRepository,
      TicketMessageRepository ticketMessageRepository,
      PasswordEncoder passwordEncoder) {
    this.userAccountRepository = userAccountRepository;
    this.bookingRepository = bookingRepository;
    this.ticketingRepository = ticketingRepository;
    this.ticketMessageRepository = ticketMessageRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional(readOnly = true)
  public Page<UserSummaryResponse> listUsers(Pageable pageable) {
    return userAccountRepository.findAll(pageable).map(this::toSummaryResponse);
  }

  @Transactional(readOnly = true)
  public UserSummaryResponse getUser(Long userId) {
    UserAccount user =
        userAccountRepository
            .findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    return toSummaryResponse(user);
  }

  @Transactional
  public UserSummaryResponse createUser(
      String username,
      String rawPassword,
      AppRole role,
      String actorUsername) {
    UserAccount actor = getRequiredUser(actorUsername);
    if (actor.getRole() != AppRole.ADMIN) {
      throw new AccessDeniedException("Only admin can create users");
    }

    String normalizedUsername = username == null ? "" : username.trim();
    if (normalizedUsername.isEmpty()) {
      throw new IllegalArgumentException("Username cannot be blank");
    }
    if (role != AppRole.STUDENT && role != AppRole.TEACHER) {
      throw new IllegalArgumentException("Role must be STUDENT or TEACHER");
    }
    if (userAccountRepository.existsByUsername(normalizedUsername)) {
      throw new DuplicateUsernameException();
    }

    UserAccount user = new UserAccount();
    user.setUsername(normalizedUsername);
    user.setPasswordHash(passwordEncoder.encode(rawPassword));
    user.setRole(role);
    user.setAuthProvider(AuthProvider.LOCAL);
    return toSummaryResponse(userAccountRepository.save(user));
  }

  @Transactional
  public UserSummaryResponse updateUserRole(Long userId, AppRole role, String actorUsername) {
    UserAccount actor = getRequiredUser(actorUsername);
    if (actor.getRole() != AppRole.ADMIN) {
      throw new AccessDeniedException("Only admin can change user roles");
    }

    if (role != AppRole.STUDENT && role != AppRole.TEACHER) {
      throw new IllegalArgumentException("Role must be STUDENT or TEACHER");
    }

    UserAccount target =
        userAccountRepository
            .findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    if (target.getRole() == AppRole.ADMIN) {
      throw new IllegalArgumentException("Admin roles cannot be changed via this endpoint");
    }

    target.setRole(role);
    UserAccount saved = userAccountRepository.save(target);
    return toSummaryResponse(saved);
  }

  @Transactional
  public void deleteUser(Long userId, String actorUsername) {
    UserAccount actor = getRequiredUser(actorUsername);
    if (actor.getRole() != AppRole.ADMIN) {
      throw new AccessDeniedException("Only admin can delete users");
    }

    UserAccount target =
        userAccountRepository
            .findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    if (target.getRole() == AppRole.ADMIN) {
      throw new IllegalArgumentException("Admin users cannot be deleted via this endpoint");
    }

    // Keep dashboard counts and module lists in sync by removing user-owned records before deletion.
    bookingRepository.deleteByBookedByUserId(target.getId());
    ticketMessageRepository.deleteByTicketStudentId(target.getId());
    ticketingRepository.deleteByStudentId(target.getId());
    ticketMessageRepository.deleteBySenderId(target.getId());

    userAccountRepository.delete(target);
  }

  private UserAccount getRequiredUser(String username) {
    return userAccountRepository
        .findByUsername(username)
        .orElseThrow(() -> new ResourceNotFoundException("User account not found"));
  }

  private UserSummaryResponse toSummaryResponse(UserAccount user) {
    UserSummaryResponse response = new UserSummaryResponse();
    response.setId(user.getId());
    response.setUsername(user.getUsername());
    response.setRole(user.getRole());
    response.setCreatedAt(user.getCreatedAt());
    response.setUpdatedAt(user.getUpdatedAt());
    return response;
  }
}
