package com.it3030.paf.smartcampus.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TicketMessageUpdateRequest {

  @NotBlank(message = "messageText is required")
  @Size(max = 4000, message = "messageText must be <= 4000 characters")
  private String messageText;

  public String getMessageText() {
    return messageText;
  }

  public void setMessageText(String messageText) {
    this.messageText = messageText;
  }
}
