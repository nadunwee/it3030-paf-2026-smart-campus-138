package com.it3030.paf.smartcampus.api.dto;

public class DashboardSummaryResponse {
  private long activeFacilitiesCount;
  private String currentMonthLabel;
  private Long pendingApprovals;
  private long myBookingsCount;
  private long openTicketsCount;

  public DashboardSummaryResponse() {}

  public DashboardSummaryResponse(
      long activeFacilitiesCount,
      String currentMonthLabel,
      Long pendingApprovals,
      long myBookingsCount,
      long openTicketsCount) {
    this.activeFacilitiesCount = activeFacilitiesCount;
    this.currentMonthLabel = currentMonthLabel;
    this.pendingApprovals = pendingApprovals;
    this.myBookingsCount = myBookingsCount;
    this.openTicketsCount = openTicketsCount;
  }

  public long getActiveFacilitiesCount() {
    return activeFacilitiesCount;
  }

  public void setActiveFacilitiesCount(long activeFacilitiesCount) {
    this.activeFacilitiesCount = activeFacilitiesCount;
  }

  public String getCurrentMonthLabel() {
    return currentMonthLabel;
  }

  public void setCurrentMonthLabel(String currentMonthLabel) {
    this.currentMonthLabel = currentMonthLabel;
  }

  public Long getPendingApprovals() {
    return pendingApprovals;
  }

  public void setPendingApprovals(Long pendingApprovals) {
    this.pendingApprovals = pendingApprovals;
  }

  public long getMyBookingsCount() {
    return myBookingsCount;
  }

  public void setMyBookingsCount(long myBookingsCount) {
    this.myBookingsCount = myBookingsCount;
  }

  public long getOpenTicketsCount() {
    return openTicketsCount;
  }

  public void setOpenTicketsCount(long openTicketsCount) {
    this.openTicketsCount = openTicketsCount;
  }
}
