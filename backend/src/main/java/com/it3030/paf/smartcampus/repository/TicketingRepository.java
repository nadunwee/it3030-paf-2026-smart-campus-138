package com.it3030.paf.smartcampus.repository;

import com.it3030.paf.smartcampus.domain.Ticketing;
import com.it3030.paf.smartcampus.domain.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TicketingRepository extends JpaRepository<Ticketing, Long>, JpaSpecificationExecutor<Ticketing> {

  Page<Ticketing> findByStudentIdOrderByUpdatedAtDesc(Long studentId, Pageable pageable);

  long countByStatus(TicketStatus status);

  long countByStudentId(Long studentId);

  long countByStudentIdAndStatusNot(Long studentId, TicketStatus status);

  long countByAssignedAdminId(Long adminId);

  long deleteByStudentId(Long studentId);
}
