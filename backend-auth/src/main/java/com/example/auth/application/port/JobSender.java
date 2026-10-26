package com.example.auth.application.port;

/** Port đẩy jobs ra RabbitMQ (mail/sms/audit). */
public interface JobSender {
  void sendMail(SendMailJob job);
  void sendSms(SendSmsJob job);
  void sendAudit(AuditJob job);

  record SendMailJob(String messageId, String to, String template, java.util.Map<String, Object> vars,
                     String traceId, int retryCount) {}
  record SendSmsJob(String messageId, String phone, String text, String traceId, int retryCount) {}
  record AuditJob(String messageId, String action, String userId, String detail,
                  String ip, String traceId) {}
}
