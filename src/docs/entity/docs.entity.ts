/* eslint-disable prettier/prettier */
import { Api } from 'src/api/entity/api.entity';
import { User } from 'src/user/entity/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Docs {
  @PrimaryGeneratedColumn('uuid')
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
  commonHeader: string;

  @Column()
  version: string;

  @Column({nullable: true})
  cause?: string;

  @Column()
  bearerToken: string;

  @ManyToOne(() => User, (user) => user.docs,{
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_creator' })
  user_creator: User;

  @OneToMany(() => Api, (api) => api.doc, { cascade: true })
  apis: Api[];
}