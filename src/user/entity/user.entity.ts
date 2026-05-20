import { Activity_Log } from "src/activity_log/entity/activity_log.entity";
import { Docs } from "src/docs/entity/docs.entity";
import { Roles } from "src/roles/entity/roles.entity";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => Roles, (role) => role.users)
  @JoinColumn({ name: "role_id" })
  role: Roles;

  @OneToMany(() => Docs, (docs) => docs.user_creator)
  docs: Docs[];

  @OneToMany(() => Activity_Log, (activity) => activity.user)
  activityLog: Activity_Log[];
}
