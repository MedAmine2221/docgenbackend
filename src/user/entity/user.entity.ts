import { MinLength } from 'class-validator';
import { Docs } from 'src/docs/entity/docs.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  @MinLength(10)
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => Roles, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Roles;

  @OneToMany('Docs', 'created_by')
  docs: Docs[];

  // @OneToMany(() => Docs, (doc) => doc.client_id)
  // docs_list: Docs[];
}
