package com.it3030.paf.smartcampus.api.dto;

import java.util.List;

public class TicketDetailResponse {

  private TicketResponse ticket;
  private List<TicketMessageResponse> messages;

  public TicketResponse getTicket() {
    return ticket;
  }

  public void setTicket(TicketResponse ticket) {
    this.ticket = ticket;
  }

  public List<TicketMessageResponse> getMessages() {
    return messages;
  }

  public void setMessages(List<TicketMessageResponse> messages) {
    this.messages = messages;
  }
}
