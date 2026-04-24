package com.it3030.paf.smartcampus.api.dto;

public class TicketOpenCountResponse {
  private long openCount;

  public TicketOpenCountResponse() {}

  public TicketOpenCountResponse(long openCount) {
    this.openCount = openCount;
  }

  public long getOpenCount() {
    return openCount;
  }

  public void setOpenCount(long openCount) {
    this.openCount = openCount;
  }
}
