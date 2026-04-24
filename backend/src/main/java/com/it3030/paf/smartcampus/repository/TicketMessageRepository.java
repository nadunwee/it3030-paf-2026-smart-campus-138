package com.it3030.paf.smartcampus.repository;

import com.it3030.paf.smartcampus.domain.TicketMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketMessageRepository extends JpaRepository<TicketMessage, Long> {
  List<TicketMessage> findByTicketTicketIdOrderBySentAtAsc(Long ticketId);

  @Modifying
  @Query(
      "delete from TicketMessage tm where tm.ticket.ticketId in "
          + "(select t.ticketId from Ticketing t where t.student.id = :studentId)")
  int deleteByTicketStudentId(@Param("studentId") Long studentId);

  long deleteBySenderId(Long senderId);
}
