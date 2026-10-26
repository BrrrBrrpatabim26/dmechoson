package com.example.auth.presentation.rest.v1;

import com.example.auth.application.dto.*;
import com.example.auth.application.usecase.AuthUseCases;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

/**
 * POST /api/v1/auth/* — versioned, RateLimiter + RequestLogger qua filter (xem SecurityConfig).
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "Register / Verify / Login / Refresh / Forgot-Reset")
public class AuthController {

  private final AuthUseCases.RegisterUseCase register;
  private final AuthUseCases.VerifyUseCase verify;
  private final AuthUseCases.LoginUseCase login;

  public AuthController(AuthUseCases.RegisterUseCase register,
                        AuthUseCases.VerifyUseCase verify,
                        AuthUseCases.LoginUseCase login) {
    this.register = register; this.verify = verify; this.login = login;
  }

  @Operation(summary = "Đăng ký tài khoản")
  @PostMapping("/register")
  public ResponseEntity<AuthResponses.ApiEnvelope<AuthResponses.RegisterData>> register(
      @Valid @RequestBody AuthRequests.RegisterRequest req,
      @RequestHeader(value = "X-Trace-Id", required = false) String traceId) {
    String tid = traceId == null ? UUID.randomUUID().toString() : traceId;
    AuthResponses.RegisterData data = register.execute(req, tid);
    return ResponseEntity.status(HttpStatus.CREATED).body(
      new AuthResponses.ApiEnvelope<>("USER_REGISTERED",
        "Đăng ký thành công, vui lòng kiểm tra email xác thực", data, tid, Instant.now()));
  }

  @Operation(summary = "Xác thực email")
  @PostMapping("/verify-email")
  public ResponseEntity<AuthResponses.ApiEnvelope<Void>> verify(
      @Valid @RequestBody AuthRequests.VerifyEmailRequest req,
      @RequestHeader(value = "X-Trace-Id", required = false) String traceId) {
    String tid = traceId == null ? UUID.randomUUID().toString() : traceId;
    verify.execute(req.token(), tid);
    return ResponseEntity.ok(new AuthResponses.ApiEnvelope<>("USER_VERIFIED",
      "Xác thực thành công", null, tid, Instant.now()));
  }

  @Operation(summary = "Đăng nhập, trả JWT")
  @PostMapping("/login")
  public ResponseEntity<AuthResponses.ApiEnvelope<AuthResponses.LoginData>> login(
      @Valid @RequestBody AuthRequests.LoginRequest req,
      @RequestHeader(value = "X-Trace-Id", required = false) String traceId) {
    String tid = traceId == null ? UUID.randomUUID().toString() : traceId;
    AuthResponses.LoginData data = login.execute(req, tid);
    return ResponseEntity.ok(new AuthResponses.ApiEnvelope<>("AUTH_OK",
      "Đăng nhập thành công", data, tid, Instant.now()));
  }

  @Operation(summary = "Rotate refresh token")
  @PostMapping("/refresh")
  public ResponseEntity<AuthResponses.ApiEnvelope<AuthResponses.RefreshData>> refresh(
      @Valid @RequestBody AuthRequests.RefreshRequest req) {
    // TODO: gọi RotateRefreshUseCase (rotate + revoke cũ)
    return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
  }

  @Operation(summary = "Quên mật khẩu (luôn 202 để chống enumeration)")
  @PostMapping("/forgot-password")
  public ResponseEntity<AuthResponses.ApiEnvelope<Void>> forgot(
      @Valid @RequestBody AuthRequests.ForgotPasswordRequest req) {
    // TODO: ForgotPasswordUseCase — nếu email tồn tại thì đẩy RabbitMQ mail job
    return ResponseEntity.status(HttpStatus.ACCEPTED).body(
      new AuthResponses.ApiEnvelope<>("RESET_QUEUED",
        "Nếu email tồn tại, link reset đã được gửi", null,
        UUID.randomUUID().toString(), Instant.now()));
  }

  @Operation(summary = "Đặt lại mật khẩu bằng token")
  @PostMapping("/reset-password")
  public ResponseEntity<AuthResponses.ApiEnvelope<Void>> reset(
      @Valid @RequestBody AuthRequests.ResetPasswordRequest req) {
    // TODO: ResetPasswordUseCase — consume token, hash mới, revoke refresh cũ
    return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
  }
}
