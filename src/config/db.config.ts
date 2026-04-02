import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Roles } from 'src/roles/entity/roles.entity';
import { User } from 'src/user/entity/user.entity';

export default (configService: ConfigService): TypeOrmModuleOptions => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const databaseUrl = configService.get('database.url');

  return {
    type: 'postgres',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    url: databaseUrl,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ssl: databaseUrl.includes('localhost')
      ? false
      : { rejectUnauthorized: false },
    entities: [User, Roles],
    synchronize: true,
  };
};
