import KeyvRedis from '@keyv/redis';
import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/env';

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  createCacheOptions(): CacheModuleOptions {
    const redisHost = this.configService.get('REDIS_HOST', { infer: true });
    const redisPort = this.configService.get('REDIS_PORT', { infer: true });
    const redisPassword = this.configService.get('REDIS_PASSWORD', {
      infer: true,
    });

    const redisConnectionString = `redis://default:${redisPassword}@${redisHost}:${redisPort}`;

    return {
      stores: [new KeyvRedis(redisConnectionString)],
    };
  }
}
