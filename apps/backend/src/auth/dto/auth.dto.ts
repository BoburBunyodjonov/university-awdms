import { createZodDto } from 'nestjs-zod';
import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  LoginSchema,
  RefreshSchema,
  ResetPasswordSchema,
} from '@awdms/shared';

export class LoginDto extends createZodDto(LoginSchema) {}
export class RefreshDto extends createZodDto(RefreshSchema) {}
export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}
export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}
export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
