package com.sjcit.securestorage.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiErrorResponse(HttpStatus.NOT_FOUND.value(), "Not Found", ex.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiErrorResponse> handleBadRequest(BadRequestException ex, HttpServletRequest request) {
        log.warn("Bad request: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorResponse(HttpStatus.BAD_REQUEST.value(), "Bad Request", ex.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiErrorResponse> handleUnauthorized(UnauthorizedException ex, HttpServletRequest request) {
        log.warn("Unauthorized: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiErrorResponse(HttpStatus.UNAUTHORIZED.value(), "Unauthorized", ex.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiErrorResponse> handleForbidden(ForbiddenException ex, HttpServletRequest request) {
        log.warn("Forbidden: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiErrorResponse(HttpStatus.FORBIDDEN.value(), "Forbidden", ex.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Access denied on {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiErrorResponse(HttpStatus.FORBIDDEN.value(), "Forbidden", "Access denied. Insufficient permissions.", request.getRequestURI()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        log.warn("Bad credentials on {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiErrorResponse(HttpStatus.UNAUTHORIZED.value(), "Unauthorized", "Invalid email or password.", request.getRequestURI()));
    }

    @ExceptionHandler(CryptoException.class)
    public ResponseEntity<ApiErrorResponse> handleCryptoException(CryptoException ex, HttpServletRequest request) {
        log.error("Cryptographic operation failed: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorResponse(HttpStatus.BAD_REQUEST.value(), "Cryptographic Error", ex.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleMaxSize(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        log.warn("Upload size exceeded: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new ApiErrorResponse(HttpStatus.PAYLOAD_TOO_LARGE.value(), "Payload Too Large", "Maximum upload size limit exceeded (50MB).", request.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorResponse(HttpStatus.BAD_REQUEST.value(), "Validation Failed", "One or more fields failed validation.", request.getRequestURI(), errors));
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodNotSupported(org.springframework.web.HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        log.warn("Method not supported on {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(new ApiErrorResponse(HttpStatus.METHOD_NOT_ALLOWED.value(), "Method Not Allowed", ex.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleNotReadable(org.springframework.http.converter.HttpMessageNotReadableException ex, HttpServletRequest request) {
        log.warn("Malformed JSON request body on {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorResponse(HttpStatus.BAD_REQUEST.value(), "Bad Request", "Malformed JSON request body.", request.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneral(Exception ex, HttpServletRequest request) {
        log.error("Unhandled internal server error on {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Internal Server Error", "An unexpected server error occurred.", request.getRequestURI()));
    }
}
