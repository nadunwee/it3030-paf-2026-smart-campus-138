package com.it3030.paf.smartcampus.repository;

import com.it3030.paf.smartcampus.domain.TicketAttachment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {

  List<TicketAttachment> findByTicketTicketIdOrderByUploadedAtAsc(Long ticketId);

  long countByTicketTicketId(Long ticketId);
}
