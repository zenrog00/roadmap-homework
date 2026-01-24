import {
  IsNotEmpty,
  IsUrl,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

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

  ACCESS_TOKEN_EXPIRES_IN = 15 * 60 * 1000; // 15m
  REFRESH_TOKEN_EXPIRES_IN = 30 * 24 * 60 * 60 * 1000; // 30d
  MAX_USER_SESSIONS = 5;
}
