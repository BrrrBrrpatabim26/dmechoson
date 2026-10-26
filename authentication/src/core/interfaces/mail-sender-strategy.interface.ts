/**
 * Tùy chọn gửi thư điện tử hoặc thông báo.
 */
export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Interface cho chiến lược gửi thư / thông báo (Mail Sender Strategy).
 *
 * Cho phép hoán đổi đa hình giữa Console/Logger (Dev/Test), SMTP (Nodemailer), SendGrid, AWS SES...
 */
export interface IMailSenderStrategy {
  /** Tên định danh của chiến lược (ví dụ: 'console', 'smtp') */
  readonly name: string;

  /**
   * Thực hiện gửi email / thông báo tới người nhận.
   *
   * @param options Thông tin người nhận, tiêu đề và nội dung thư
   * @returns Kết quả gửi kèm messageId (nếu có)
   */
  sendMail(options: SendMailOptions): Promise<{ success: boolean; messageId?: string }>;
}
