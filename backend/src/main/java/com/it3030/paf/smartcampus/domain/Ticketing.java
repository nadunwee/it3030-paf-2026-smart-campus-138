package com.it3030.paf.smartcampus.domain;

import com.it3030.paf.smartcampus.domain.enums.TicketCategory;
import com.it3030.paf.smartcampus.domain.enums.TicketPriority;
import com.it3030.paf.smartcampus.domain.enums.TicketStatus;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ticketing")
public class Ticketing {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "ticket_id")
  private Long ticketId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "student_id", nullable = false)
  private UserAccount student;

  @Column(name = "student_name", nullable = false, length = 64)
  private String studentName;

  @Enumerated(EnumType.STRING)
  @Column(name = "category", nullable = false, length = 32)
  private TicketCategory category;

  @Column(name = "subject", nullable = false, length = 255)
  private String subject;

  @Column(name = "description", nullable = false, length = 2000)
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 16)
  private TicketStatus status;

  @Enumerated(EnumType.STRING)
  @Column(name = "priority", nullable = false, length = 16)
  private TicketPriority priority;

  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  @Column(name = "closed_at")
  private OffsetDateTime closedAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "assigned_admin_id")
  private UserAccount assignedAdmin;

  @OneToMany(mappedBy = "ticket", fetch = FetchType.LAZY)
  private List<TicketMessage> messages = new ArrayList<>();

  @PrePersist
  void onCreate() {
    OffsetDateTime now = OffsetDateTime.now();
    if (createdAt == null) {
      createdAt = now;
    }
    if (updatedAt == null) {
      updatedAt = now;
    }
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = OffsetDateTime.now();
  }

  public Long getTicketId() {
    return ticketId;
  }

  public UserAccount getStudent() {
    return student;
  }

  public void setStudent(UserAccount student) {
    this.student = student;
  }

  public String getStudentName() {
    return studentName;
  }

  public void setStudentName(String studentName) {
    this.studentName = studentName;
  }

  public TicketCategory getCategory() {
    return category;
  }

  public void setCategory(TicketCategory category) {
    this.category = category;
  }

  public String getSubject() {
    return subject;
  }

  public void setSubject(String subject) {
    this.subject = subject;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public TicketStatus getStatus() {
    return status;
  }

  public void setStatus(TicketStatus status) {
    this.status = status;
  }

  public TicketPriority getPriority() {
    return priority;
  }

  public void setPriority(TicketPriority priority) {
    this.priority = priority;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(OffsetDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }

  public OffsetDateTime getClosedAt() {
    return closedAt;
  }

  public void setClosedAt(OffsetDateTime closedAt) {
    this.closedAt = closedAt;
  }

  public UserAccount getAssignedAdmin() {
    return assignedAdmin;
  }

  public void setAssignedAdmin(UserAccount assignedAdmin) {
    this.assignedAdmin = assignedAdmin;
  }

  public List<TicketMessage> getMessages() {
    return messages;
  }

  public void setMessages(List<TicketMessage> messages) {
    this.messages = messages;
  }
}
