package com.it3030.paf.smartcampus.api.dto;

public class PendingCountResponse {
  private long pendingCount;

  public PendingCountResponse() {}

  public PendingCountResponse(long pendingCount) {
    this.pendingCount = pendingCount;
  }

  public long getPendingCount() {
    return pendingCount;
  }

  public void setPendingCount(long pendingCount) {
    this.pendingCount = pendingCount;
  }
}
