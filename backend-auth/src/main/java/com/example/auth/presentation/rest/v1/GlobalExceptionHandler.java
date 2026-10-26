package com.example.auth.presentation.rest.v1;

import com.example.auth.application.dto.AuthResponses;
import com.example.auth.domain.DomainException;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

/** Chuẩn hóa mã lỗi: 400/401/403/404/409/422/500 theo skill Backend. */
@RestControllerAdvice
public class GlobalExceptionHandler {

  private String trace(HttpServletRequest r) {
    String t = r.getHeader("X-Trace-Id");
    return t == null ? UUID.randomUUID().toString() : t;
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<AuthResponses.ErrorEnvelope> badRequest(
      MethodArgumentNotValidException e, HttpServletRequest r) {
    List<AuthResponses.FieldError> fs = e.getBindingResult().getFieldErrors().stream()
      .map(f -> new AuthResponses.FieldError(f.getField(), f.getDefaultMessage(), "INVALID"))
      .toList();
    return ResponseEntity.badRequest().body(new AuthResponses.ErrorEnvelope(
      "BAD_REQUEST", "Dữ liệu đầu vào không hợp lệ", fs, trace(r), Instant.now(), r.getRequestURI()));
  }

  @ExceptionHandler(DomainException.class)
  public ResponseEntity<AuthResponses.ErrorEnvelope> domain(DomainException e, HttpServletRequest r) {
    HttpStatus st = switch (e.getCode()) {
      case "USER_EMAIL_CONFLICT" -> HttpStatus.CONFLICT;            // 409
      case "USER_NOT_FOUND" -> HttpStatus.NOT_FOUND;                // 404
      case "USER_NOT_VERIFIED" -> HttpStatus.UNPROCESSABLE_ENTITY;  // 422
      case "AUTH_BAD_CREDENTIALS" -> HttpStatus.UNAUTHORIZED;       // 401
      case "USER_LOCKED" -> HttpStatus.FORBIDDEN;                   // 403
      default -> HttpStatus.UNPROCESSABLE_ENTITY;                    // 422 domain rule
    };
    return ResponseEntity.status(st).body(new AuthResponses.ErrorEnvelope(
      e.getCode(), e.getMessage(), List.of(), trace(r), Instant.now(), r.getRequestURI()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<AuthResponses.ErrorEnvelope> internal(Exception e, HttpServletRequest r) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
      new AuthResponses.ErrorEnvelope("INTERNAL", "Lỗi hệ thống",
        List.of(), trace(r), Instant.now(), r.getRequestURI()));
  }
}
