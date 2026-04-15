import { Injectable, Inject } from '@nestjs/common';
import { compareWithHash, createHash } from 'src/common/utils/hash';
import { FindOptionsWhere, LessThan } from 'typeorm';
import { RefreshSession } from './entities';
import { AUTH_MODULE_OPTIONS } from './auth.module-definition';
import type { AuthModuleOptions } from './auth.module-options';
import { UsersService } from 'src/users/';
import { Transactional } from 'typeorm-transactional';
import { Cron } from '@nestjs/schedule';
import { RefreshSessionsRepository } from './refresh-sessions.repository';

@Injectable()
export class RefreshSessionsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly refreshSessionRepository: RefreshSessionsRepository,
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly authModuleOptions: AuthModuleOptions,
  ) {}

  // every day at 01:00 Moscow
  @Cron('0 1 * * *', {
    timeZone: 'Europe/Moscow',
  })
  private async deleteExpiredSessions() {
    await this.refreshSessionRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  @Transactional()
  async createSession(userId: string, fingeprint: string) {
    // locking user with select for update
    // to prevent race conditions and creating
    // more than authModuleOptions.maxUserSessions for user
    await this.usersService.lockUserForUpdate(userId);

    const activeSessions =
      await this.refreshSessionRepository.countActive(userId);
    if (activeSessions >= this.authModuleOptions.maxUserSessions) {
      await this.deleteEarliestActiveSession(userId);
    }

    const hashedFingerpint = await createHash(fingeprint);
    const refreshSession = this.refreshSessionRepository.create({
      userId,
      fingeprint: hashedFingerpint,
      expiresIn: this.authModuleOptions.refreshTokenExpiresIn,
    });
    const { id } = await this.refreshSessionRepository.save(refreshSession);
    return id;
  }

  @Transactional()
  async replaceSession(
    { id: idForDelete, userId }: RefreshSession,
    fingerprint: string,
  ) {
    await this.refreshSessionRepository.delete({ id: idForDelete });
    const id = await this.createSession(userId, fingerprint);
    return id;
  }

  async findSession(opts: FindOptionsWhere<RefreshSession>) {
    return await this.refreshSessionRepository.findOneBy(opts);
  }

  async deleteSession(opts: FindOptionsWhere<RefreshSession>) {
    return await this.refreshSessionRepository.delete(opts);
  }

  async validateSession(session: RefreshSession | null, fingeprint: string) {
    if (session) {
      if (
        !this.isSessionExpired(session) &&
        (await compareWithHash(fingeprint, session.fingeprint))
      ) {
        return session;
      }
    }
  }

  async countActiveSessions(userId: string) {
    return this.refreshSessionRepository.countActive(userId);
  }

  isSessionExpired({ expiresIn, createdAt }: RefreshSession) {
    const createdAtTime = createdAt.getTime();
    const currentTime = Date.now();
    return currentTime > createdAtTime + expiresIn;
  }

  @Transactional()
  private async deleteEarliestActiveSession(userId: string) {
    const oldestSession =
      await this.refreshSessionRepository.findEarliestActive(userId);
    if (oldestSession) {
      await this.refreshSessionRepository.delete({ id: oldestSession.id });
    }
  }
}
