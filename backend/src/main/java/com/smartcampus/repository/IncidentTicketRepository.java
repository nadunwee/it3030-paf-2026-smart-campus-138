package com.smartcampus.repository;

import com.smartcampus.model.IncidentTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface IncidentTicketRepository extends JpaRepository<IncidentTicket, Long> {

    List<IncidentTicket> findByReporterId(Long reporterId);

    List<IncidentTicket> findByAssignedToId(Long technicianId);

    List<IncidentTicket> findByStatus(IncidentTicket.TicketStatus status);

    @Query("SELECT t FROM IncidentTicket t WHERE " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:category IS NULL OR t.category = :category)")
    List<IncidentTicket> findByFilters(
            @Param("status") IncidentTicket.TicketStatus status,
            @Param("priority") IncidentTicket.TicketPriority priority,
            @Param("category") IncidentTicket.TicketCategory category
    );
}
