import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compareWithHash, createHash } from 'src/common/utils/hash';
import { FindOptionsWhere, IsNull, LessThan, Repository } from 'typeorm';
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
  async createSession(userId: string, fingeprint: string) {
    // locking user with select for update
    // to prevent race conditions and creating
    // more than authModuleOptions.maxUserSessions for user
    await this.usersService.lockUserForUpdate(userId);

    const activeSessions = await this.countActiveSessions(userId);
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
    await this.deleteSession({ id: idForDelete });
    const id = await this.createSession(userId, fingerprint);
    return id;
  }

  async deleteSession(opts: FindOptionsWhere<RefreshSession>) {
    await this.refreshSessionRepository.delete(opts);
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

  isSessionExpired({ expiresIn, createdAt }: RefreshSession) {
    const createdAtTime = createdAt.getTime();
    const currentTime = Date.now();
    return currentTime > createdAtTime + expiresIn;
  }

  // every day at 01:00 Moscow
  @Cron('0 1 * * *', {
    timeZone: 'Europe/Moscow',
  })
  private async deleteExpiredSessions() {
    await this.refreshSessionRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async findOneBy(opts: FindOptionsWhere<RefreshSession>) {
    const session = await this.refreshSessionRepository.findOne({
      where: {
        ...opts,
        user: {
          deletedAt: IsNull(),
        },
      },
      relations: { user: true },
    });
    // findOne uses leftJoin for relations and
    // returns session even if user is soft deleted
    if (session === null || session.user === null) {
      return null;
    }
    return session;
  }

  async countActiveSessions(userId: string) {
    return await this.refreshSessionRepository
      .createQueryBuilder('session')
      .innerJoin('session.user', 'user')
      .where('session.userId = :userId', { userId })
      .andWhere('session.expiresAt > now()')
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
      .createQueryBuilder('session')
      .innerJoin('session.user', 'user')
      .where('session.userId = :userId', { userId })
      .andWhere('session.expiresAt > now()')
      .orderBy('session.createdAt', 'ASC')
      .limit(1)
      .getOne();
  }
}
