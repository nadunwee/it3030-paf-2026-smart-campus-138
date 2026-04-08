package com.it3030.paf.smartcampus.repository;

import com.it3030.paf.smartcampus.domain.FacilityResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface FacilityResourceRepository extends JpaRepository<FacilityResource, Long>, JpaSpecificationExecutor<FacilityResource> {
}

