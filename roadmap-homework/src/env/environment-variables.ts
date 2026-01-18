import { IsNotEmpty, IsUrl, IsNumber, Min, Max } from 'class-validator';

export class EnvironmentVariables {
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  POSTGRES_HOST: string;

  @IsNumber()
  @Min(0)
  @Max(65536)
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
