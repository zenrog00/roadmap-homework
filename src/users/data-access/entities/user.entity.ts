import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  email: string;

  @Column({ type: 'date' })
  birthdate: Date;

  @Column()
  description: string;

  @Column()
  password: string;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
