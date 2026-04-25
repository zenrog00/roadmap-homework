import {
  BullRootModuleOptions,
  SharedBullConfigurationFactory,
} from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/env';

@Injectable()
export class BullMqConfigService implements SharedBullConfigurationFactory {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  createSharedConfiguration(): BullRootModuleOptions {
    return {
      connection: {
        host: this.configService.get('REDIS_HOST', { infer: true }),
        port: this.configService.get('REDIS_PORT', { infer: true }),
        password: this.configService.get('REDIS_PASSWORD', { infer: true }),
      },
    };
  }
}
