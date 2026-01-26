import { BadRequestException, Injectable } from '@nestjs/common';
import { UserDto } from './dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PostgresErrorCode } from 'src/database/postgres-error-code';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async saveUser(userDto: UserDto) {
    try {
      // Creating user entity to use beforeInsert method
      const user = this.usersRepository.create(userDto);
      const { id } = await this.usersRepository.save(user);
      return id;
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (err?.code === PostgresErrorCode.UniqueViolation) {
        throw new BadRequestException(
          `Username ${userDto.username} already exists!`,
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new Error(`Unhandled error when saving user: ${err?.message}`, {
        cause: err,
      });
    }
  }

  async findOneBy(opts: FindOptionsWhere<User>) {
    return await this.usersRepository.findOneBy(opts);
  }

  async findAll(username?: string) {
    return await this.usersRepository.find({
      where: {
        ...(username && { username }),
      },
    });
  }

  async lockUserForUpdate(userId: string) {
    await this.usersRepository
      .createQueryBuilder()
      .setLock('pessimistic_write')
      .where('id = :userId', { userId })
      .getOne();
  }
}
