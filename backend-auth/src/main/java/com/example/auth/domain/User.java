package com.example.auth.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * User Aggregate Root — Transaction Boundary cho Auth.
 * Bất biến: email duy nhất, status chuyển đổi có kiểm soát.
 */
public class User {

  private static final Pattern EMAIL_RX =
      Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

  public enum Status { PENDING, ACTIVE, LOCKED }

  private final String id; // ULID 26 chars
  private final String email; // normalized lowercase
  private String passwordHash;
  private String fullName;
  private Status status;
  private Instant emailVerifiedAt;
  private int failedAttempts;
  private Instant lockUntil;
  private final Instant createdAt;
  private Instant updatedAt;

  private final List<Object> domainEvents = new ArrayList<>();

  private User(String id, String email, String passwordHash, String fullName) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.fullName = fullName;
    this.status = Status.PENDING;
    this.createdAt = Instant.now();
    this.updatedAt = this.createdAt;
  }

  public static User register(String ulid, String rawEmail, String passwordHash, String fullName) {
    if (ulid == null || ulid.length() != 26) throw new DomainException("USER_INVALID_ID", "ULID phải 26 ký tự");
    String email = normalizeEmail(rawEmail);
    if (passwordHash == null || passwordHash.isBlank()) throw new DomainException("USER_EMPTY_PASSWORD", "passwordHash rỗng");
    if (fullName == null || fullName.isBlank() || fullName.length() > 100)
      throw new DomainException("USER_INVALID_NAME", "fullName 1..100 ký tự");
    User u = new User(ulid, email, passwordHash, fullName);
    u.domainEvents.add(new UserRegisteredEvent(ulid, email, fullName, Instant.now()));
    return u;
  }

  public void verify() {
    if (this.status == Status.ACTIVE && this.emailVerifiedAt != null)
      throw new DomainException("USER_ALREADY_VERIFIED", "Tài khoản đã xác thực");
    if (this.status == Status.LOCKED && lockUntil != null && Instant.now().isBefore(lockUntil))
      throw new DomainException("USER_LOCKED", "Tài khoản đang bị khóa");
    this.status = Status.ACTIVE;
    this.emailVerifiedAt = Instant.now();
    this.updatedAt = Instant.now();
    this.domainEvents.add(new UserVerifiedEvent(this.id, this.email, this.emailVerifiedAt));
  }

  public void recordLoginFailure(String reason) {
    this.failedAttempts++;
    this.updatedAt = Instant.now();
    if (this.failedAttempts >= 5) {
      this.status = Status.LOCKED;
      this.lockUntil = Instant.now().plusSeconds(15 * 60);
    }
    this.domainEvents.add(new UserLoginFailedEvent(this.id, this.email, reason, this.failedAttempts, Instant.now()));
  }

  public void recordLoginSuccess() {
    this.failedAttempts = 0;
    this.lockUntil = null;
    this.updatedAt = Instant.now();
    if (this.status == Status.LOCKED && (lockUntil == null || Instant.now().isAfter(lockUntil))) {
      this.status = this.emailVerifiedAt != null ? Status.ACTIVE : Status.PENDING;
    }
  }

  public static String normalizeEmail(String raw) {
    if (raw == null) throw new DomainException("USER_INVALID_EMAIL", "Email rỗng");
    String e = raw.trim().toLowerCase();
    if (e.length() > 255 || !EMAIL_RX.matcher(e).matches())
      throw new DomainException("USER_INVALID_EMAIL", "Email không hợp lệ: " + raw);
    return e;
  }

  public List<Object> pullEvents() {
    List<Object> out = new ArrayList<>(domainEvents);
    domainEvents.clear();
    return out;
  }

  // getters
  public String getId() { return id; }
  public String getEmail() { return email; }
  public String getPasswordHash() { return passwordHash; }
  public String getFullName() { return fullName; }
  public Status getStatus() { return status; }
  public Instant getEmailVerifiedAt() { return emailVerifiedAt; }
  public int getFailedAttempts() { return failedAttempts; }
  public Instant getLockUntil() { return lockUntil; }

  // ---- Domain Events (record giản lược để serialize) ----
  public record UserRegisteredEvent(String userId, String email, String fullName, Instant occurredAt) {}
  public record UserVerifiedEvent(String userId, String email, Instant occurredAt) {}
  public record UserLoginFailedEvent(String userId, String email, String reason, int attemptCount, Instant occurredAt) {}
}
