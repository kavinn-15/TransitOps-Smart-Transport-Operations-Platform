package com.transitops.fleet.exception;

import org.springframework.http.HttpStatus;

/** Thrown for any business-rule violation (validation, RBAC, conflicts). */
public class ApiException extends RuntimeException {
    private final HttpStatus status;

    public ApiException(String message) {
        this(message, HttpStatus.BAD_REQUEST);
    }

    public ApiException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() { return status; }
}
