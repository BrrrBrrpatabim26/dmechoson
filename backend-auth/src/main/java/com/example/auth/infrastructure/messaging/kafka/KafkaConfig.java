package com.example.auth.infrastructure.messaging.kafka;

import java.util.Map;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/** Kafka topics: 6 partitions, 3 replicas (prod), retention 7 ngày. */
@Configuration
public class KafkaTopicsConfig {

  @Bean NewTopic topicRegistered(@Value("${kafka-topics.registered}") String t) {
    return TopicBuilder.name(t).partitions(6).replicas(1)
      .config("retention.ms", "604800000").config("cleanup.policy", "delete").build();
  }
  @Bean NewTopic topicVerified(@Value("${kafka-topics.verified}") String t) {
    return TopicBuilder.name(t).partitions(6).replicas(1)
      .config("retention.ms", "604800000").build();
  }
  @Bean NewTopic topicLoginFailed(@Value("${kafka-topics.login-failed}") String t) {
    return TopicBuilder.name(t).partitions(6).replicas(1)
      .config("retention.ms", "259200000").build(); // 3 ngày là đủ
  }
}

/** Adapter: EventPublisher -> Kafka (key=userId để giữ order theo user). */
@Component
class KafkaEventPublisher implements com.example.auth.application.port.EventPublisher {
  private final KafkaTemplate<String, Object> kafka;
  KafkaEventPublisher(KafkaTemplate<String, Object> kafka) { this.kafka = kafka; }

  @Override
  public void publish(String topic, String key, Object payload, Map<String, String> headers) {
    // structured log: timestamp, trace_id, action=kafka.publish, topic, key
    org.apache.kafka.clients.producer.ProducerRecord<String, Object> rec =
      new org.apache.kafka.clients.producer.ProducerRecord<>(topic, key, payload);
    if (headers != null) headers.forEach((k, v) ->
      rec.headers().add(k, v == null ? null : v.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    kafka.send(rec); // idempotent producer (enable-idempotence=true, acks=all)
  }
}
