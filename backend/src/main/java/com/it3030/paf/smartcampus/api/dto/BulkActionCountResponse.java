package com.it3030.paf.smartcampus.api.dto;

public class BulkActionCountResponse {

  private long count;

  public BulkActionCountResponse() {}

  public BulkActionCountResponse(long count) {
    this.count = count;
  }

  public long getCount() {
    return count;
  }

  public void setCount(long count) {
    this.count = count;
  }
}
