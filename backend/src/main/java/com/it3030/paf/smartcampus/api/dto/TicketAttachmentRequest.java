package com.it3030.paf.smartcampus.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TicketAttachmentRequest {

  @NotBlank(message = "fileName is required")
  @Size(max = 255, message = "fileName must be <= 255 characters")
  private String fileName;

  @NotBlank(message = "contentType is required")
  @Size(max = 64, message = "contentType must be <= 64 characters")
  private String contentType;

  @NotBlank(message = "dataUrl is required")
  @Size(max = 2_000_000, message = "dataUrl must be <= 2MB")
  private String dataUrl;

  public String getFileName() {
    return fileName;
  }

  public void setFileName(String fileName) {
    this.fileName = fileName;
  }

  public String getContentType() {
    return contentType;
  }

  public void setContentType(String contentType) {
    this.contentType = contentType;
  }

  public String getDataUrl() {
    return dataUrl;
  }

  public void setDataUrl(String dataUrl) {
    this.dataUrl = dataUrl;
  }
}
