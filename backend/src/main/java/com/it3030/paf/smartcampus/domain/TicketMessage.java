package com.it3030.paf.smartcampus.domain;

import com.it3030.paf.smartcampus.domain.enums.TicketSenderRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "ticket_messages")
public class TicketMessage {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "message_id")
  private Long messageId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "ticket_id", nullable = false)
  private Ticketing ticket;

  @Column(name = "sender_id", nullable = false)
  private Long senderId;

  @Column(name = "sender_name", nullable = false, length = 64)
  private String senderName;

  @Enumerated(EnumType.STRING)
  @Column(name = "sender_role", nullable = false, length = 16)
  private TicketSenderRole senderRole;

  @Column(name = "message_text", nullable = false, length = 4000)
  private String messageText;

  @Column(name = "sent_at", nullable = false, updatable = false)
  private OffsetDateTime sentAt;

  @PrePersist
  void onCreate() {
    if (sentAt == null) {
      sentAt = OffsetDateTime.now();
    }
  }

  public Long getMessageId() {
    return messageId;
  }

  public Ticketing getTicket() {
    return ticket;
  }

  public void setTicket(Ticketing ticket) {
    this.ticket = ticket;
  }

  public Long getSenderId() {
    return senderId;
  }

  public void setSenderId(Long senderId) {
    this.senderId = senderId;
  }

  public String getSenderName() {
    return senderName;
  }

  public void setSenderName(String senderName) {
    this.senderName = senderName;
  }

  public TicketSenderRole getSenderRole() {
    return senderRole;
  }

  public void setSenderRole(TicketSenderRole senderRole) {
    this.senderRole = senderRole;
  }

  public String getMessageText() {
    return messageText;
  }

  public void setMessageText(String messageText) {
    this.messageText = messageText;
  }

  public OffsetDateTime getSentAt() {
    return sentAt;
  }

  public void setSentAt(OffsetDateTime sentAt) {
    this.sentAt = sentAt;
  }
}
