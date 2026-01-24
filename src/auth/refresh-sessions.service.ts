import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'src/common/utils/hash';
import { Repository } from 'typeorm';
import { RefreshSession } from './entities';
import { AUTH_MODULE_OPTIONS } from './auth.module-definition';
import type { AuthModuleOptions } from './auth.module-options';

@Injectable()
export class RefreshSessionsService {
  constructor(
    @InjectRepository(RefreshSession)
    private readonly refreshSessionRepository: Repository<RefreshSession>,
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly authModuleOption: AuthModuleOptions,
  ) {}

  async createSession(userId: string, ip: string, userAgent: string) {
    const fingeprint = this.createFingerpint(ip, userAgent);
    const hashedFingerpint = await createHash(fingeprint);
    const refreshSession = this.refreshSessionRepository.create({
      userId,
      fingeprint: hashedFingerpint,
      expiresIn: this.authModuleOption.refreshTokenExpiresIn,
    });
    const { id } = await this.refreshSessionRepository.save(refreshSession);
    return id;
  }

  private createFingerpint(ip: string, userAgent: string) {
    const separator = '|';
    return ip + separator + userAgent;
  }
}
