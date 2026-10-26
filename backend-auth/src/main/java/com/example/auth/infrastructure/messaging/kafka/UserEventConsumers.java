package com.example.auth.infrastructure.messaging.kafka;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;
import java.util.Map;

/**
 * Consumers mẫu: notification-service + audit-service.
 * ack-mode=manual_immediate, concurrency=3, seek-to-current on error.
 */
@Component
public class UserEventConsumers {

  // Gửi mail xác thực khi nhận user.registered
  @KafkaListener(topics = "${kafka-topics.registered}", groupId = "notification-service")
  public void onRegistered(@Payload Map<String, Object> payload,
                           @Header(KafkaHeaders.RECEIVED_KEY) String key,
                           Acknowledgment ack) {
    // TODO: gọi JobSender.sendMail(verify-email) — idempotent theo eventId
    ack.acknowledge();
  }

  @KafkaListener(topics = "${kafka-topics.verified}", groupId = "notification-service")
  public void onVerified(@Payload Map<String, Object> payload, Acknowledgment ack) {
    // TODO: gửi mail chào mừng
    ack.acknowledge();
  }

  @KafkaListener(topics = "${kafka-topics.login-failed}", groupId = "risk-service")
  public void onLoginFailed(@Payload Map<String, Object> payload, Acknowledgment ack) {
    // TODO: đếm attemptCount -> khóa IP/user nếu vượt ngưỡng
    ack.acknowledge();
  }

  @KafkaListener(topics = {"${kafka-topics.registered}", "${kafka-topics.verified}",
                           "${kafka-topics.login-failed}"}, groupId = "audit-service")
  public void audit(@Payload Map<String, Object> payload, Acknowledgment ack) {
    // TODO: append-only audit log
    ack.acknowledge();
  }
}
