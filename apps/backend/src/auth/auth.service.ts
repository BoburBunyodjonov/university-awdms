import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload, JwtTokenType } from './types/jwt-payload';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult extends AuthTokens {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: User['role'];
    teacherId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens(user);
    return {
      ...tokens,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        teacherId: user.teacherId,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Wrong token type');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Token no longer valid');
    }
    return this.issueTokens(user);
  }

  // §10.1: "Session invalidated on logout" — bump tokenVersion so every
  // outstanding access/refresh JWT for this user is rejected.
  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        teacherId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async hashPassword(plain: string): Promise<string> {
    const rounds = Number(this.config.get('BCRYPT_ROUNDS') ?? 12);
    return bcrypt.hash(plain, rounds);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const basePayload: Omit<JwtPayload, 'type'> = {
      sub: user.id,
      role: user.role,
      teacherId: user.teacherId,
      tokenVersion: user.tokenVersion,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(basePayload, 'access'),
      this.signToken(basePayload, 'refresh'),
    ]);
    return { accessToken, refreshToken };
  }

  private signToken(
    base: Omit<JwtPayload, 'type'>,
    type: JwtTokenType,
  ): Promise<string> {
    const secret = this.config.getOrThrow<string>(
      type === 'access' ? 'JWT_ACCESS_SECRET' : 'JWT_REFRESH_SECRET',
    );
    const expiresIn = this.config.get<string>(
      type === 'access' ? 'JWT_ACCESS_EXPIRES_IN' : 'JWT_REFRESH_EXPIRES_IN',
    ) ?? (type === 'access' ? '15m' : '7d');
    return this.jwt.signAsync({ ...base, type }, { secret, expiresIn });
  }
}
