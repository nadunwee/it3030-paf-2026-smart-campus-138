package com.it3030.paf.smartcampus.api.dto;

import com.it3030.paf.smartcampus.domain.enums.TicketCategory;
import com.it3030.paf.smartcampus.domain.enums.TicketPriority;
import com.it3030.paf.smartcampus.domain.enums.TicketStatus;
import java.time.OffsetDateTime;

public class TicketResponse {

  private Long ticketId;
  private Long studentId;
  private String studentName;
  private TicketCategory category;
  private String subject;
  private String description;
  private Long resourceId;
  private String resourceLabel;
  private String location;
  private String preferredContactDetails;
  private TicketStatus status;
  private TicketPriority priority;
  private OffsetDateTime createdAt;
  private OffsetDateTime updatedAt;
  private OffsetDateTime closedAt;
  private String resolutionNotes;
  private String rejectionReason;
  private Long assignedAdminId;
  private Long assignedStaffId;
  private String assignedStaffName;
  private int attachmentCount;

  public Long getTicketId() {
    return ticketId;
  }

  public void setTicketId(Long ticketId) {
    this.ticketId = ticketId;
  }

  public Long getStudentId() {
    return studentId;
  }

  public void setStudentId(Long studentId) {
    this.studentId = studentId;
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

  public Long getResourceId() {
    return resourceId;
  }

  public void setResourceId(Long resourceId) {
    this.resourceId = resourceId;
  }

  public String getResourceLabel() {
    return resourceLabel;
  }

  public void setResourceLabel(String resourceLabel) {
    this.resourceLabel = resourceLabel;
  }

  public String getLocation() {
    return location;
  }

  public void setLocation(String location) {
    this.location = location;
  }

  public String getPreferredContactDetails() {
    return preferredContactDetails;
  }

  public void setPreferredContactDetails(String preferredContactDetails) {
    this.preferredContactDetails = preferredContactDetails;
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

  public String getResolutionNotes() {
    return resolutionNotes;
  }

  public void setResolutionNotes(String resolutionNotes) {
    this.resolutionNotes = resolutionNotes;
  }

  public String getRejectionReason() {
    return rejectionReason;
  }

  public void setRejectionReason(String rejectionReason) {
    this.rejectionReason = rejectionReason;
  }

  public Long getAssignedAdminId() {
    return assignedAdminId;
  }

  public void setAssignedAdminId(Long assignedAdminId) {
    this.assignedAdminId = assignedAdminId;
  }

  public Long getAssignedStaffId() {
    return assignedStaffId;
  }

  public void setAssignedStaffId(Long assignedStaffId) {
    this.assignedStaffId = assignedStaffId;
  }

  public String getAssignedStaffName() {
    return assignedStaffName;
  }

  public void setAssignedStaffName(String assignedStaffName) {
    this.assignedStaffName = assignedStaffName;
  }

  public int getAttachmentCount() {
    return attachmentCount;
  }

  public void setAttachmentCount(int attachmentCount) {
    this.attachmentCount = attachmentCount;
  }
}
