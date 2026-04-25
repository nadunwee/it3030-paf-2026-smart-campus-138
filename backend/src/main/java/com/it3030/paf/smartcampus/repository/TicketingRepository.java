package com.it3030.paf.smartcampus.repository;

import com.it3030.paf.smartcampus.domain.Ticketing;
import com.it3030.paf.smartcampus.domain.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketingRepository extends JpaRepository<Ticketing, Long>, JpaSpecificationExecutor<Ticketing> {

  Page<Ticketing> findByStudentIdOrderByUpdatedAtDesc(Long studentId, Pageable pageable);

  Page<Ticketing> findByAssignedAdminIdOrderByUpdatedAtDesc(Long assignedAdminId, Pageable pageable);

  long countByStatus(TicketStatus status);

  long countByStudentId(Long studentId);

  long countByStudentIdAndStatusNot(Long studentId, TicketStatus status);

  long countByAssignedAdminId(Long adminId);

  @Modifying
  @Query("update Ticketing t set t.assignedAdmin = null where t.assignedAdmin.id = :userId")
  int clearAssignedAdmin(@Param("userId") Long userId);

  long deleteByStudentId(Long studentId);
}
