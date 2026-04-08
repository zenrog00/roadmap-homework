import { User } from 'src/users/entities';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Avatar } from './avatar.entity';

@Entity({ name: 'users_avatars' })
export class UserAvatar {
  @PrimaryColumn('uuid')
  user_id: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @PrimaryColumn('uuid', { unique: true })
  avatarId: string;

  @ManyToOne(() => Avatar, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'avatarId' })
  avatar: Avatar;
}
