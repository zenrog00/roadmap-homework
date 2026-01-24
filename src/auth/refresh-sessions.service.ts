import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'src/common/utils/hash';
import { Repository } from 'typeorm';
import { RefreshSession } from './entities';
import { AUTH_MODULE_OPTIONS } from './auth.module-definition';
import type { AuthModuleOptions } from './auth.module-options';
import { UsersService } from 'src/users/users.service';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class RefreshSessionsService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(RefreshSession)
    private readonly refreshSessionRepository: Repository<RefreshSession>,
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly authModuleOptions: AuthModuleOptions,
  ) {}

  @Transactional()
  async createSession(userId: string, ip: string, userAgent: string) {
    // locking user with select for update
    // to prevent race conditions and creating
    // more than authModuleOptions.maxUserSessions for user
    await this.usersService.lockUserForUpdate(userId);

    const activeSessions = await this.countActiveSessions(userId);
    if (activeSessions >= this.authModuleOptions.maxUserSessions) {
      await this.deleteEarliestActiveSession(userId);
    }

    const fingeprint = this.createFingerpint(ip, userAgent);
    const hashedFingerpint = await createHash(fingeprint);
    const refreshSession = this.refreshSessionRepository.create({
      userId,
      fingeprint: hashedFingerpint,
      expiresIn: this.authModuleOptions.refreshTokenExpiresIn,
    });
    const { id } = await this.refreshSessionRepository.save(refreshSession);
    return id;
  }

  private async countActiveSessions(userId: string) {
    return await this.refreshSessionRepository
      .createQueryBuilder()
      .where('"userId" = :userId', { userId })
      .andWhere(
        `"createdAt" + ("expiresIn" || ' milliseconds')::interval > now()`,
      )
      .getCount();
  }

  @Transactional()
  private async deleteEarliestActiveSession(userId: string) {
    const oldestSession = await this.findEarliestActiveSession(userId);
    if (oldestSession) {
      await this.refreshSessionRepository.delete(oldestSession.id);
    }
  }

  private async findEarliestActiveSession(userId: string) {
    return await this.refreshSessionRepository
      .createQueryBuilder()
      .where('"userId" = :userId', { userId })
      .andWhere(
        `"createdAt" + ("expiresIn" || ' milliseconds')::interval > now()`,
      )
      .orderBy('"createdAt"', 'ASC')
      .limit(1)
      .getOne();
  }

  private createFingerpint(ip: string, userAgent: string) {
    const separator = '|';
    return ip + separator + userAgent;
  }
}
