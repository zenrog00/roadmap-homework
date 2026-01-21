import { Injectable } from '@nestjs/common';
import { UserDto } from './dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './data-access/entities';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async saveUser(userDto: UserDto) {
    const { id } = await this.usersRepository.save(userDto);
    return id;
  }
}
