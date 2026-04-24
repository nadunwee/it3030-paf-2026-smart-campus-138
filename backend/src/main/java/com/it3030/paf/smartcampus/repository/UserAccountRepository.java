package com.it3030.paf.smartcampus.repository;

import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import com.it3030.paf.smartcampus.domain.enums.AuthProvider;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

  Optional<UserAccount> findByUsername(String username);

  Optional<UserAccount> findByGoogleSub(String googleSub);

  Optional<UserAccount> findByEmailIgnoreCaseAndAuthProvider(String email, AuthProvider authProvider);

  boolean existsByUsername(String username);

  boolean existsByRole(AppRole role);

  List<UserAccount> findAllByRole(AppRole role);
}
