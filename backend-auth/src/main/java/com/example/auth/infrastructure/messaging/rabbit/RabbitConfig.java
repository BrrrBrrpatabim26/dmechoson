package com.example.auth.infrastructure.messaging.rabbit;

import com.example.auth.application.port.JobSender;
import java.util.*;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

/**
 * RabbitMQ: exchange user.direct + 3 queues + DLX/DLQ, retry 3 lần.
 * Routing: user.mail.send / user.sms.send / user.audit.log
 */
@Configuration
public class RabbitConfig {

  @Bean DirectExchange userDirect(@Value("${rabbit.exchange}") String ex) {
    return new DirectExchange(ex, true, false);
  }

  @Bean Queue mailQueue(@Value("${rabbit.queue-mail}") String q) {
    return QueueBuilder.durable(q)
      .withArgument("x-dead-letter-exchange", "")
      .withArgument("x-dead-letter-routing-key", "user.dlq")
      .withArgument("x-message-ttl", 300000).build();
  }
  @Bean Queue smsQueue(@Value("${rabbit.queue-sms}") String q) {
    return QueueBuilder.durable(q)
      .withArgument("x-dead-letter-exchange", "")
      .withArgument("x-dead-letter-routing-key", "user.dlq").build();
  }
  @Bean Queue auditQueue(@Value("${rabbit.queue-audit}") String q) {
    return QueueBuilder.durable(q)
      .withArgument("x-dead-letter-exchange", "")
      .withArgument("x-dead-letter-routing-key", "user.dlq").build();
  }
  @Bean Queue dlq(@Value("${rabbit.queue-dlq}") String q) {
    return QueueBuilder.durable(q).build();
  }

  @Bean Binding bMail(Queue mailQueue, DirectExchange userDirect,
                      @Value("${rabbit.rk-mail}") String rk) {
    return BindingBuilder.bind(mailQueue).to(userDirect).with(rk);
  }
  @Bean Binding bSms(Queue smsQueue, DirectExchange userDirect,
                     @Value("${rabbit.rk-sms}") String rk) {
    return BindingBuilder.bind(smsQueue).to(userDirect).with(rk);
  }
  @Bean Binding bAudit(Queue auditQueue, DirectExchange userDirect,
                       @Value("${rabbit.rk-audit}") String rk) {
    return BindingBuilder.bind(auditQueue).to(userDirect).with(rk);
  }
}

/** Adapter: JobSender -> RabbitMQ (persistent, messageId để dedup). */
@Component
class RabbitJobPublisher implements JobSender {
  private final RabbitTemplate rabbit;
  private final org.springframework.core.env.Environment env;
  RabbitJobPublisher(RabbitTemplate rabbit, org.springframework.core.env.Environment env) {
    this.rabbit = rabbit; this.env = env;
  }
  private String ex() { return env.getProperty("rabbit.exchange", "user.direct"); }

  @Override public void sendMail(SendMailJob job) {
    rabbit.convertAndSend(ex(), env.getProperty("rabbit.rk-mail", "user.mail.send"), job,
      m -> { m.getMessageProperties().setMessageId(job.messageId());
             m.getMessageProperties().setHeader("traceId", job.traceId()); return m; });
  }
  @Override public void sendSms(SendSmsJob job) {
    rabbit.convertAndSend(ex(), env.getProperty("rabbit.rk-sms", "user.sms.send"), job);
  }
  @Override public void sendAudit(AuditJob job) {
    rabbit.convertAndSend(ex(), env.getProperty("rabbit.rk-audit", "user.audit.log"), job);
  }
}

/** Consumers: manual ack, throw AmqpRejectAndDontRequeue -> DLQ sau 3 lần. */
@Component
class RabbitJobConsumers {

  @RabbitListener(queues = "${rabbit.queue-mail}", concurrency = "2")
  public void mail(JobSender.SendMailJob job) {
    // TODO: SendGrid/SES; idempotent theo messageId
  }

  @RabbitListener(queues = "${rabbit.queue-sms}", concurrency = "2")
  public void sms(JobSender.SendSmsJob job) {
    // TODO: Twilio/SNS
  }

  @RabbitListener(queues = "${rabbit.queue-audit}", concurrency = "1")
  public void audit(JobSender.AuditJob job) {
    // TODO: ghi audit append-only
  }

  @RabbitListener(queues = "${rabbit.queue-dlq}")
  public void dlq(Object raw) {
    // TODO: alert + dashboard, replay thủ công
  }
}
