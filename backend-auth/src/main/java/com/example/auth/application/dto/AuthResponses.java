package com.example.auth.application.dto;

import java.time.Instant;

/** Response DTOs — envelope chuẩn {code,message,data,traceId,timestamp}. */
public final class AuthResponses {

  private AuthResponses() {}

  public record UserDto(String id, String email, String fullName, String status,
                        Instant emailVerifiedAt, Instant createdAt) {}

  /** 201 Created sau Register. verifyTokenHint chỉ lộ 6 ký tự cuối ở môi trường dev. */
  public record RegisterData(UserDto user, boolean verificationEmailQueued) {}

  public record ApiEnvelope<T>(String code, String message, T data, String traceId, Instant timestamp) {}

  public record LoginData(String accessToken, String refreshToken, String tokenType,
                          long expiresIn, UserDto user) {}

  public record RefreshData(String accessToken, String refreshToken, long expiresIn) {}

  public record FieldError(String field, String message, String code) {}

  public record ErrorEnvelope(String code, String message, java.util.List<FieldError> errors,
                              String traceId, Instant timestamp, String path) {}
}
