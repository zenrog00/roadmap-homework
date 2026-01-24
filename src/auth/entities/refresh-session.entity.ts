import { User } from 'src/users/entities';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Index,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

@Entity()
export class RefreshSession {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column('uuid')
  userId: string;

  @Column()
  fingeprint: string;

  @Column('bigint')
  expiresIn: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
