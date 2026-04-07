package com.it3030.paf.smartcampus.exception;

public class DuplicateUsernameException extends RuntimeException {

  public DuplicateUsernameException() {
    super("Username already taken");
  }
}
