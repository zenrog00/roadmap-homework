import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CursorPaginationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @IsPositive()
  limit = 10;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isPrevious?: boolean;
}
