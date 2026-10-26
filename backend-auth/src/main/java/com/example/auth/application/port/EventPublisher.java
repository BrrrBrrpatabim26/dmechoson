package com.example.auth.application.port;

import java.util.Map;

/** Port phát Domain Events ra Kafka (async, idempotent). */
public interface EventPublisher {
  void publish(String topic, String key, Object payload, Map<String, String> headers);
}
