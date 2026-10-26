package com.example.auth.application.usecase;

import com.example.auth.application.dto.*;
import com.example.auth.application.port.*;
import com.example.auth.domain.*;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * 5 Use Cases Auth — mỗi class 1 việc (SRP), transaction ở adapter JPA.
 * Giản lược: password hashing + token store được trừu tượng qua ports phụ.
 */
public final class AuthUseCases {

  private AuthUseCases() {}

  // ---- 1. Register ----
  public static class RegisterUseCase {
    private final UserRepository users;
    private final EventPublisher events;
    private final JobSender jobs;
    private final PasswordHasher hasher;
    private final TokenStore tokens;
    private final UlidGenerator ulids;

    public RegisterUseCase(UserRepository users, EventPublisher events, JobSender jobs,
                           PasswordHasher hasher, TokenStore tokens, UlidGenerator ulids) {
      this.users = users; this.events = events; this.jobs = jobs;
      this.hasher = hasher; this.tokens = tokens; this.ulids = ulids;
    }

    public AuthResponses.RegisterData execute(AuthRequests.RegisterRequest req, String traceId) {
      String email = User.normalizeEmail(req.email());
      if (users.existsByEmail(email))
        throw new DomainException("USER_EMAIL_CONFLICT", "Email đã tồn tại");
      String id = ulids.next();
      User u = User.register(id, email, hasher.hash(req.password()), req.fullName().trim());
      users.save(u); // @Transactional ở adapter
      String verifyToken = tokens.issueVerifyToken(id, 24 * 60);
      for (Object e : u.pullEvents()) {
        if (e instanceof User.UserRegisteredEvent re)
          events.publish("user.registered", re.userId(),
            Map.of("eventId", UUID.randomUUID().toString(), "eventType", "user.registered",
                   "version", 1, "occurredAt", Instant.now().toString(),
                   "userId", re.userId(), "email", re.email(), "fullName", re.fullName(),
                   "traceId", traceId),
            Map.of("traceId", traceId));
      }
      jobs.sendMail(new JobSender.SendMailJob(UUID.randomUUID().toString(), email,
        "verify-email", Map.of("token", verifyToken, "name", req.fullName()), traceId, 0));
      jobs.sendAudit(new JobSender.AuditJob(UUID.randomUUID().toString(), "USER_REGISTER", id,
        "Register from ip=" + req.clientIp(), req.clientIp(), traceId));
      return new AuthResponses.RegisterData(
        new AuthResponses.UserDto(id, email, req.fullName().trim(), "PENDING", null, Instant.now()), true);
    }
  }

  // ---- 2. Verify ----
  public static class VerifyUseCase {
    private final UserRepository users;
    private final EventPublisher events;
    private final TokenStore tokens;
    public VerifyUseCase(UserRepository users, EventPublisher events, TokenStore tokens) {
      this.users = users; this.events = events; this.tokens = tokens;
    }
    public void execute(String token, String traceId) {
      String userId = tokens.consumeVerifyToken(token); // 404/410 nếu sai/hết hạn
      User u = users.findById(userId)
        .orElseThrow(() -> new DomainException("USER_NOT_FOUND", "Không tìm thấy user"));
      u.verify();
      users.save(u);
      for (Object e : u.pullEvents()) {
        if (e instanceof User.UserVerifiedEvent ve)
          events.publish("user.verified", ve.userId(),
            Map.of("eventId", UUID.randomUUID().toString(), "eventType", "user.verified",
                   "version", 1, "occurredAt", Instant.now().toString(),
                   "userId", ve.userId(), "email", ve.email(), "traceId", traceId),
            Map.of("traceId", traceId));
      }
    }
  }

  // ---- 3. Login (thất bại -> Kafka user.login_failed + RabbitMQ audit) ----
  public static class LoginUseCase {
    private final UserRepository users;
    private final EventPublisher events;
    private final JobSender jobs;
    private final PasswordHasher hasher;
    private final TokenStore tokens;
    public LoginUseCase(UserRepository users, EventPublisher events, JobSender jobs,
                        PasswordHasher hasher, TokenStore tokens) {
      this.users = users; this.events = events; this.jobs = jobs;
      this.hasher = hasher; this.tokens = tokens;
    }
    public AuthResponses.LoginData execute(AuthRequests.LoginRequest req, String traceId) {
      String email = User.normalizeEmail(req.email());
      User u = users.findByEmail(email).orElse(null);
      if (u == null || !hasher.matches(req.password(), u.getPasswordHash())) {
        if (u != null) {
          u.recordLoginFailure("BAD_CREDENTIALS");
          users.save(u);
          for (Object e : u.pullEvents()) {
            if (e instanceof User.UserLoginFailedEvent le)
              events.publish("user.login_failed", le.userId() == null ? email : le.userId(),
                Map.of("eventId", UUID.randomUUID().toString(), "eventType", "user.login_failed",
                       "version", 1, "occurredAt", Instant.now().toString(),
                       "userId", String.valueOf(le.userId()), "email", le.email(),
                       "reason", le.reason(), "attemptCount", le.attemptCount(),
                       "ip", String.valueOf(req.clientIp()), "traceId", traceId),
                Map.of("traceId", traceId));
          }
        }
        throw new DomainException("AUTH_BAD_CREDENTIALS", "Email hoặc mật khẩu không đúng");
      }
      if (u.getStatus() == User.Status.LOCKED && u.getLockUntil() != null
          && Instant.now().isBefore(u.getLockUntil()))
        throw new DomainException("USER_LOCKED", "Tài khoản bị khóa tạm thời, thử lại sau");
      if (u.getStatus() == User.Status.PENDING)
        throw new DomainException("USER_NOT_VERIFIED", "Chưa xác thực email (422)");
      u.recordLoginSuccess();
      users.save(u);
      String access = tokens.issueAccess(u.getId(), u.getEmail());
      String refresh = tokens.issueRefresh(u.getId());
      return new AuthResponses.LoginData(access, refresh, "Bearer", 900,
        new AuthResponses.UserDto(u.getId(), u.getEmail(), u.getFullName(),
          u.getStatus().name(), u.getEmailVerifiedAt(), Instant.now()));
    }
  }

  // ---- Ports phụ ----
  public interface PasswordHasher {
    String hash(String raw);
    boolean matches(String raw, String hash);
  }
  public interface TokenStore {
    String issueVerifyToken(String userId, long ttlMinutes);
    String consumeVerifyToken(String token);
    String issueAccess(String userId, String email);
    String issueRefresh(String userId);
    String rotateRefresh(String refreshToken);
    String issueResetToken(String userId, long ttlMinutes);
    String consumeResetToken(String token);
  }
  public interface UlidGenerator { String next(); }
}
