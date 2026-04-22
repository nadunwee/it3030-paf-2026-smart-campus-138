package com.it3030.paf.smartcampus.repository;

import com.it3030.paf.smartcampus.domain.FacilityResource;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FacilityResourceRepository extends JpaRepository<FacilityResource, Long>, JpaSpecificationExecutor<FacilityResource> {

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT r FROM FacilityResource r WHERE r.id = :id")
  Optional<FacilityResource> findByIdForUpdate(@Param("id") Long id);
}
