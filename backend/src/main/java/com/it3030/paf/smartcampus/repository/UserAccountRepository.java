package com.it3030.paf.smartcampus.repository;

import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.AppRole;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

  Optional<UserAccount> findByUsername(String username);

  boolean existsByUsername(String username);

  boolean existsByRole(AppRole role);
}
