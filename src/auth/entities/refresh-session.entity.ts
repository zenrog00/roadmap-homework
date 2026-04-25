import { User } from 'src/users/entities';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Index,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

@Entity({ name: 'refresh_sessions' })
export class RefreshSession {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  prepareEntity() {
    if (!this.id) {
      this.id = uuidv7();
    }
    // generating expiresAt and createdAt to prevent
    // milliseconds mismatch when generating createdAt as
    // transaction CURRENT_TIMESTAMP and calculating expiresAt
    // using Date object methods
    const now = new Date();
    this.createdAt = now;
    this.expiresAt = new Date(now.getTime() + this.expiresIn);
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

  @Index()
  @Column('timestamp with time zone')
  expiresAt: Date;

  @Column('timestamp with time zone')
  createdAt: Date;
}
