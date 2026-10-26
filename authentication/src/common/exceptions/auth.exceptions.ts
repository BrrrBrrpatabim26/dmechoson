import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../constants/error-codes.constant.js';
import { AppException } from './app.exception.js';

export class InvalidCredentialsException extends AppException {
  constructor(message: string = 'Email hoặc mật khẩu không chính xác') {
    super(ERROR_CODES.AUTH_INVALID_CREDENTIALS, message, HttpStatus.UNAUTHORIZED);
  }
}

export class AccountLockedException extends AppException {
  constructor(minutesRemaining: number) {
    super(
      ERROR_CODES.AUTH_ACCOUNT_LOCKED,
      `Tài khoản tạm thời bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${minutesRemaining} phút.`,
      HttpStatus.UNAUTHORIZED,
      { minutesRemaining },
    );
  }
}

export class AccountDisabledException extends AppException {
  constructor(message: string = 'Tài khoản của bạn đã bị vô hiệu hóa hoặc bị khóa') {
    super(ERROR_CODES.AUTH_ACCOUNT_DISABLED, message, HttpStatus.UNAUTHORIZED);
  }
}

export class EmailAlreadyExistsException extends AppException {
  constructor(email: string) {
    super(
      ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS,
      `Địa chỉ email [${email}] đã được đăng ký trong hệ thống`,
      HttpStatus.CONFLICT,
      { email },
    );
  }
}

export class TokenExpiredException extends AppException {
  constructor(message: string = 'Token đã hết hạn. Vui lòng làm mới hoặc đăng nhập lại.') {
    super(ERROR_CODES.AUTH_TOKEN_EXPIRED, message, HttpStatus.UNAUTHORIZED);
  }
}

export class TokenInvalidException extends AppException {
  constructor(message: string = 'Token không hợp lệ hoặc không đúng định dạng') {
    super(ERROR_CODES.AUTH_TOKEN_INVALID, message, HttpStatus.UNAUTHORIZED);
  }
}

export class TokenReusedException extends AppException {
  constructor() {
    super(
      ERROR_CODES.AUTH_TOKEN_REUSED,
      'Cảnh báo bảo mật: Refresh token đã từng được sử dụng. Toàn bộ phiên làm việc bị hủy bỏ để phòng chống tấn công.',
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class PasswordSameAsCurrentException extends AppException {
  constructor() {
    super(
      ERROR_CODES.AUTH_PASSWORD_SAME_AS_CURRENT,
      'Mật khẩu mới không được trùng với mật khẩu hiện tại',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class AuthMethodDisabledException extends AppException {
  constructor(method: string) {
    super(
      ERROR_CODES.AUTH_METHOD_DISABLED,
      `Phương thức xác thực [${method}] hiện đang bị vô hiệu hóa bởi chính sách hệ thống`,
      HttpStatus.FORBIDDEN,
      { method },
    );
  }
}

export class OtpInvalidException extends AppException {
  constructor(message: string = 'Mã OTP không chính xác. Vui lòng kiểm tra lại.') {
    super(ERROR_CODES.AUTH_OTP_INVALID, message, HttpStatus.UNAUTHORIZED);
  }
}

export class OtpExpiredException extends AppException {
  constructor(message: string = 'Mã OTP hoặc liên kết xác thực đã hết hạn. Vui lòng yêu cầu mã mới.') {
    super(ERROR_CODES.AUTH_OTP_EXPIRED, message, HttpStatus.UNAUTHORIZED);
  }
}

export class OtpMaxAttemptsExceededException extends AppException {
  constructor(message: string = 'Bạn đã nhập sai mã OTP quá 5 lần. Mã này đã bị vô hiệu hóa vì lý do an toàn.') {
    super(ERROR_CODES.AUTH_OTP_MAX_ATTEMPTS_EXCEEDED, message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

export class IdentityAlreadyLinkedException extends AppException {
  constructor(provider: string, providerUserId: string) {
    super(
      ERROR_CODES.AUTH_IDENTITY_ALREADY_LINKED,
      `Phương thức xác thực [${provider}] với định danh [${providerUserId}] đã được liên kết với một tài khoản khác`,
      HttpStatus.CONFLICT,
      { provider, providerUserId },
    );
  }
}

/**
 * Tài khoản đã bật MFA (TOTP) nhưng yêu cầu đăng nhập chưa kèm mã OTP.
 * Client phải thu mã từ authenticator và gửi lại signup/signin với trường `otp`.
 */
export class MfaRequiredException extends AppException {
  constructor() {
    super(
      ERROR_CODES.AUTH_MFA_REQUIRED,
      'Tài khoản đã bật xác thực đa yếu tố. Vui lòng cung cấp mã TOTP (6 số) trong yêu cầu đăng nhập.',
      HttpStatus.UNAUTHORIZED,
    );
  }
}

/** Mã TOTP cung cấp khi đăng nhập không chính xác hoặc đã hết hiệu lực. */
export class MfaInvalidException extends AppException {
  constructor() {
    super(
      ERROR_CODES.AUTH_MFA_INVALID,
      'Mã TOTP không chính xác hoặc đã hết hiệu lực.',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
