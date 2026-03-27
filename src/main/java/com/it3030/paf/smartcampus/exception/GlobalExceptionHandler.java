package com.it3030.paf.smartcampus.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
    return buildError(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage(), request);
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<ApiError> handleNoResourceFound(NoResourceFoundException ex, HttpServletRequest request) {
    return buildError(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage(), request);
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
    return buildError(HttpStatus.FORBIDDEN, "Forbidden", ex.getMessage(), request);
  }

  @ExceptionHandler({MethodArgumentNotValidException.class})
  public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
    List<ValidationError> errors =
        ex.getBindingResult().getFieldErrors().stream()
            .map(this::mapFieldError)
            .collect(Collectors.toList());

    ApiError apiError =
        ApiError.builder()
            .status(HttpStatus.BAD_REQUEST.value())
            .error("Bad Request")
            .message("Validation failed")
            .path(request.getRequestURI())
            .timestamp(Instant.now().toString())
            .details(errors)
            .build();

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(apiError);
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
    return buildError(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage(), request);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> handleGeneric(Exception ex, HttpServletRequest request) {
    // For local debugging: ensures the real exception stack trace is visible in the console logs.
    // (Safe for assignment/demo; remove later if you want a quieter production style.)
    ex.printStackTrace();
    // Avoid leaking internals into `message`, but do provide the exception type + message in `details`.
    String details =
        ex.getClass().getSimpleName() + (ex.getMessage() == null ? "" : ": " + ex.getMessage());

    ApiError apiError =
        ApiError.builder()
            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
            .error("Internal Server Error")
            .message("Unexpected error")
            .path(request.getRequestURI())
            .timestamp(Instant.now().toString())
            .details(details)
            .build();

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(apiError);
  }

  private ValidationError mapFieldError(FieldError error) {
    return new ValidationError(error.getField(), error.getDefaultMessage());
  }

  private ResponseEntity<ApiError> buildError(
      HttpStatus status, String error, String message, HttpServletRequest request
  ) {
    ApiError body =
        ApiError.builder()
            .status(status.value())
            .error(error)
            .message(message)
            .path(request.getRequestURI())
            .timestamp(Instant.now().toString())
            .build();
    return ResponseEntity.status(status).body(body);
  }

  public static class ValidationError {
    private final String field;
    private final String message;

    public ValidationError(String field, String message) {
      this.field = field;
      this.message = message;
    }

    public String getField() {
      return field;
    }

    public String getMessage() {
      return message;
    }
  }

  public static class ApiError {
    private final int status;
    private final String error;
    private final String message;
    private final String path;
    private final String timestamp;
    private final Object details;

    private ApiError(Builder builder) {
      this.status = builder.status;
      this.error = builder.error;
      this.message = builder.message;
      this.path = builder.path;
      this.timestamp = builder.timestamp;
      this.details = builder.details;
    }

    public static Builder builder() {
      return new Builder();
    }

    public int getStatus() {
      return status;
    }

    public String getError() {
      return error;
    }

    public String getMessage() {
      return message;
    }

    public String getPath() {
      return path;
    }

    public String getTimestamp() {
      return timestamp;
    }

    public Object getDetails() {
      return details;
    }

    public static class Builder {
      private int status;
      private String error;
      private String message;
      private String path;
      private String timestamp;
      private Object details;

      public Builder status(int status) {
        this.status = status;
        return this;
      }

      public Builder error(String error) {
        this.error = error;
        return this;
      }

      public Builder message(String message) {
        this.message = message;
        return this;
      }

      public Builder path(String path) {
        this.path = path;
        return this;
      }

      public Builder timestamp(String timestamp) {
        this.timestamp = timestamp;
        return this;
      }

      public Builder details(Object details) {
        this.details = details;
        return this;
      }

      public ApiError build() {
        return new ApiError(this);
      }
    }
  }
}

