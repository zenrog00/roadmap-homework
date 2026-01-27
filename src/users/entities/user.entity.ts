import {
  BeforeInsert,
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

@Entity()
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }

  @Column({ unique: true })
  username: string;

  @Column()
  email: string;

  @Column('date')
  birthdate: Date;

  @Column()
  description: string;

  @Column()
  password: string;

  @UpdateDateColumn({ type: 'timestamp with time zone', select: false })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', select: false })
  deletedAt: Date;
}
