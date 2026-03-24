package com.smartcampus.dto;

import com.smartcampus.model.IncidentTicket;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TicketRequest {

    private Long resourceId;

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Category is required")
    private IncidentTicket.TicketCategory category;

    @NotBlank(message = "Description is required")
    private String description;

    private IncidentTicket.TicketPriority priority;

    private String contactDetails;
}
