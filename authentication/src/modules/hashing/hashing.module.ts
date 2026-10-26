import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '../../core/tokens/injection.tokens.js';
import { Argon2PasswordHasher } from './argon2-hasher.service.js';
import { BcryptPasswordHasher } from './bcrypt-hasher.service.js';
import { PasswordHasherService } from './password-hasher.service.js';

@Module({
  providers: [
    Argon2PasswordHasher,
    BcryptPasswordHasher,
    PasswordHasherService,
    {
      provide: INJECTION_TOKENS.PASSWORD_HASHER,
      useExisting: PasswordHasherService,
    },
  ],
  exports: [
    Argon2PasswordHasher,
    BcryptPasswordHasher,
    PasswordHasherService,
    INJECTION_TOKENS.PASSWORD_HASHER,
  ],
})
export class HashingModule {}
