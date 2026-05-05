import { User } from "src/user/entity/user.entity";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class Activity_Log {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  description: string;

  @Column()
  dateAction: Date;

  @Column()
  typeAction: string;

  @ManyToOne(() => User, (user) => user.activityLog)
  @JoinColumn({ name: "user" })
  user: User;
}
