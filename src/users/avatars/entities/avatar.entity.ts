import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'avatars' })
export class Avatar {
  @PrimaryColumn('uuid')
  id: string;

  @Column('bigint')
  size: number;

  @Column()
  mimetype: string;

  @CreateDateColumn({ type: 'timestamp with time zone', select: false })
  createdAt: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', select: false })
  deletedAt: Date;
}
