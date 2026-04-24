package com.it3030.paf.smartcampus.api.dto;

import com.it3030.paf.smartcampus.domain.enums.TicketSenderRole;
import java.time.OffsetDateTime;

public class TicketMessageResponse {

  private Long messageId;
  private Long senderId;
  private TicketSenderRole senderRole;
  private String senderName;
  private String messageContent;
  private OffsetDateTime sentAt;

  public Long getMessageId() {
    return messageId;
  }

  public void setMessageId(Long messageId) {
    this.messageId = messageId;
  }

  public Long getSenderId() {
    return senderId;
  }

  public void setSenderId(Long senderId) {
    this.senderId = senderId;
  }

  public TicketSenderRole getSenderRole() {
    return senderRole;
  }

  public void setSenderRole(TicketSenderRole senderRole) {
    this.senderRole = senderRole;
  }

  public String getSenderName() {
    return senderName;
  }

  public void setSenderName(String senderName) {
    this.senderName = senderName;
  }

  public String getMessageContent() {
    return messageContent;
  }

  public void setMessageContent(String messageContent) {
    this.messageContent = messageContent;
  }

  public OffsetDateTime getSentAt() {
    return sentAt;
  }

  public void setSentAt(OffsetDateTime sentAt) {
    this.sentAt = sentAt;
  }
}
