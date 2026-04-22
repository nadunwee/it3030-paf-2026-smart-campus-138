package com.it3030.paf.smartcampus.api.dto;

public class DashboardSummaryResponse {
  private long activeFacilitiesCount;
  private String currentMonthLabel;
  private Long pendingApprovals;

  public DashboardSummaryResponse() {}

  public DashboardSummaryResponse(long activeFacilitiesCount, String currentMonthLabel, Long pendingApprovals) {
    this.activeFacilitiesCount = activeFacilitiesCount;
    this.currentMonthLabel = currentMonthLabel;
    this.pendingApprovals = pendingApprovals;
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
}
