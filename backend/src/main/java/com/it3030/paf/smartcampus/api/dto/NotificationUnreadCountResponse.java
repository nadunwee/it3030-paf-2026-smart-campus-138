package com.it3030.paf.smartcampus.api.dto;

public class NotificationUnreadCountResponse {

  private long unreadCount;

  public NotificationUnreadCountResponse() {}

  public NotificationUnreadCountResponse(long unreadCount) {
    this.unreadCount = unreadCount;
  }

  public long getUnreadCount() {
    return unreadCount;
  }

  public void setUnreadCount(long unreadCount) {
    this.unreadCount = unreadCount;
  }
}
