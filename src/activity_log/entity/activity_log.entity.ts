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

  @Column({ default: false })
  isRollbackable: boolean;

  @ManyToOne(() => User, (user) => user.activityLog, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user" })
  user: User;
}
