import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';

/** Liveness for reverse proxies / Docker health — no DB call (fast). */
@SkipThrottle()
@Public()
@Controller('health')
export class HealthController {
  @Get()
  live() {
    return { ok: true, service: 'awdms-backend' };
  }
}
