package com.smartcampus.dto;

import com.smartcampus.model.IncidentTicket;
import lombok.Data;

@Data
public class TicketStatusUpdateRequest {
    private IncidentTicket.TicketStatus status;
    private String resolutionNotes;
    private String rejectionReason;
    private Long assignedToId;
}
