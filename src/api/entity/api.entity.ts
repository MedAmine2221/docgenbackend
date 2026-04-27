/* eslint-disable prettier/prettier */
import { Docs } from 'src/docs/entity/docs.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Api {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  apiMethod: string;

  @Column()
  endPoint: string;

  @ManyToOne(() => Docs, (docs) => docs.apis)
  @JoinColumn({ name: 'doc_id' })
  doc: Docs;
}