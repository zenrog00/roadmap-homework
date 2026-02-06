import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { EnvironmentVariables } from 'src/env';
import { ConfigService } from '@nestjs/config';
import { ConfigurableAuthModule } from './auth.module-definition';
import { UsersModule } from 'src/users';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshSession } from './entities';
import { JwtStrategy, LocalStrategy } from './strategies';
import { RefreshSessionsService } from './refresh-sessions.service';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards';
import { RefreshSessionsRepository } from './refresh-sessions.repository';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<EnvironmentVariables, true>,
      ) => ({
        secret: configService.get('JWT_SECRET', { infer: true }),
        signOptions: {
          expiresIn: configService.get('ACCESS_TOKEN_EXPIRES_IN', {
            infer: true,
          }),
        },
      }),
    }),
    TypeOrmModule.forFeature([RefreshSession]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RefreshSessionsService,
    RefreshSessionsRepository,
    LocalStrategy,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AuthModule extends ConfigurableAuthModule {}
