/* eslint-disable prettier/prettier */
import { MinLength } from 'class-validator';
import { User } from 'src/user/entity/user.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Roles {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  @MinLength(10)
  name_fr: string;

  @Column()
  @MinLength(10)
  name_eng: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
