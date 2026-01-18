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
}
