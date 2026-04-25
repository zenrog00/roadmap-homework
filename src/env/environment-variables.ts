import {
  IsNotEmpty,
  IsUrl,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { StringValue } from 'ms';

export class EnvironmentVariables {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(65535)
  APP_PORT?: number;

  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  POSTGRES_HOST: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  POSTGRES_PORT: number;

  @IsNotEmpty()
  POSTGRES_USER: string;

  @IsNotEmpty()
  POSTGRES_PASSWORD: string;

  @IsNotEmpty()
  POSTGRES_DB: string;

  @IsNotEmpty()
  JWT_SECRET: string;

  ACCESS_TOKEN_EXPIRES_IN: StringValue = '300m';
  REFRESH_TOKEN_EXPIRES_IN: StringValue = '30d';
  MAX_USER_SESSIONS = 5;

  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  MINIO_HOST: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  MINIO_PORT: number;

  @IsNotEmpty()
  MINIO_ROOT_USER: string;

  @IsNotEmpty()
  MINIO_ROOT_PASSWORD: string;

  @IsNotEmpty()
  MINIO_USERS_AVATARS_BUCKET: string;

  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  REDIS_HOST: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  REDIS_PORT: number;

  @IsNotEmpty()
  REDIS_PASSWORD: string;
}
