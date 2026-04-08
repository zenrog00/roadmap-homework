import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity()
export class Avatar {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  size: string;

  @Column()
  mimetype: string;

  @CreateDateColumn({ type: 'timestamp with time zone', select: false })
  createdAt: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', select: false })
  deletedAt: Date;
}
