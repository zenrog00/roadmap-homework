import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compareWithHash, createHash } from 'src/common/utils/hash';
import { FindOptionsWhere, LessThan, Repository } from 'typeorm';
import { RefreshSession } from './entities';
import { AUTH_MODULE_OPTIONS } from './auth.module-definition';
import type { AuthModuleOptions } from './auth.module-options';
import { UsersService } from 'src/users/users.service';
import { Transactional } from 'typeorm-transactional';
import { Cron } from '@nestjs/schedule';

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

  @Transactional()
  async findAndDeleteSession(id?: string) {
    if (!id) {
      return null;
    }
    const session = await this.findOneBy({ id });
    if (session) {
      await this.refreshSessionRepository.delete(session.id);
    }
    return session;
  }

  async deleteSession(opts: FindOptionsWhere<RefreshSession>) {
    await this.refreshSessionRepository.delete(opts);
  }

  async validateSession(
    session: RefreshSession | null,
    ip: string,
    userAgent: string,
  ) {
    if (session) {
      const newFingerpint = this.createFingerpint(ip, userAgent);
      if (
        !this.isSessionExpired(session) &&
        (await compareWithHash(newFingerpint, session.fingeprint))
      ) {
        return session;
      }
    }
  }

  isSessionExpired({ expiresIn, createdAt }: RefreshSession) {
    const createdAtTime = createdAt.getTime();
    const currentTime = Date.now();
    return currentTime > createdAtTime + expiresIn;
  }

  // every day at 01:00 Moscow
  @Cron('0 1 * * *', {
    timeZone: 'Europe/Moscow',
  })
  async deleteExpiredSessions() {
    await this.refreshSessionRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  private async findOneBy(opts: FindOptionsWhere<RefreshSession>) {
    return await this.refreshSessionRepository.findOne({
      where: opts,
      relations: { user: true },
    });
  }

  private async countActiveSessions(userId: string) {
    return await this.refreshSessionRepository
      .createQueryBuilder()
      .where('"userId" = :userId', { userId })
      .andWhere('"expiresAt" > now()')
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
      .andWhere('"expiresAt" > now()')
      .orderBy('"createdAt"', 'ASC')
      .limit(1)
      .getOne();
  }

  private createFingerpint(ip: string, userAgent: string) {
    const separator = '|';
    return ip + separator + userAgent;
  }
}
