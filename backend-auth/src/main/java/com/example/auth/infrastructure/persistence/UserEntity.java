package com.example.auth.infrastructure.persistence;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "users", indexes = {
  @Index(name = "ux_users_email", columnList = "email", unique = true),
  @Index(name = "ix_users_status", columnList = "status")
})
public class UserEntity {
  @Id
  @Column(length = 26)
  private String id;

  @Column(nullable = false, length = 255, unique = true)
  private String email;

  @Column(name = "password_hash", nullable = false, length = 255)
  private String passwordHash;

  @Column(name = "full_name", nullable = false, length = 100)
  private String fullName;

  @Column(nullable = false, length = 16)
  private String status; // PENDING | ACTIVE | LOCKED

  @Column(name = "email_verified_at")
  private Instant emailVerifiedAt;

  @Column(name = "failed_attempts", nullable = false)
  private int failedAttempts = 0;

  @Column(name = "lock_until")
  private Instant lockUntil;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  // getters/setters
  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getPasswordHash() { return passwordHash; }
  public void setPasswordHash(String v) { this.passwordHash = v; }
  public String getFullName() { return fullName; }
  public void setFullName(String v) { this.fullName = v; }
  public String getStatus() { return status; }
  public void setStatus(String v) { this.status = v; }
  public Instant getEmailVerifiedAt() { return emailVerifiedAt; }
  public void setEmailVerifiedAt(Instant v) { this.emailVerifiedAt = v; }
  public int getFailedAttempts() { return failedAttempts; }
  public void setFailedAttempts(int v) { this.failedAttempts = v; }
  public Instant getLockUntil() { return lockUntil; }
  public void setLockUntil(Instant v) { this.lockUntil = v; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant v) { this.createdAt = v; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant v) { this.updatedAt = v; }
}
