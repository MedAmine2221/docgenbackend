import { User } from 'src/user/entity/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Docs {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  submissionDate: Date;

  @Column()
  status: string;

  @Column()
  baseUrl: string;

  @Column()
  apiMethod: string;

  @Column()
  commonHeader: string;

  @Column()
  bearerToken: string;

  @ManyToOne('User', 'docs')
  @JoinColumn({ name: 'doc_creator' })
  created_by: User;

  // @ManyToOne(() => User, (user) => user.docs)
  // @JoinColumn({ name: 'client_id' })
  // client_id: User;
}
