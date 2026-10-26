package com.example.auth.application.dto;

import jakarta.validation.constraints.*;
import java.time.Instant;

/** Request DTOs — validation tại presentation layer (Bean Validation). */
public final class AuthRequests {

  private AuthRequests() {}

  public record RegisterRequest(
      @NotBlank @Email @Size(max = 255) String email,
      @NotBlank @Size(min = 8, max = 72)
      @Pattern(regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).+$",
        message = "password phải có hoa, thường và số") String password,
      @NotBlank @Size(min = 1, max = 100) String fullName,
      @Size(max = 45) String clientIp) {}

  public record VerifyEmailRequest(@NotBlank String token) {}

  public record LoginRequest(
      @NotBlank @Email String email,
      @NotBlank @Size(min = 1, max = 72) String password,
      @Size(max = 45) String clientIp,
      @Size(max = 512) String userAgent) {}

  public record RefreshRequest(@NotBlank String refreshToken) {}

  public record ForgotPasswordRequest(@NotBlank @Email String email) {}

  public record ResetPasswordRequest(
      @NotBlank String token,
      @NotBlank @Size(min = 8, max = 72)
      @Pattern(regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).+$",
        message = "password phải có hoa, thường và số") String newPassword) {}
}
