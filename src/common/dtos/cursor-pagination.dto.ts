import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CursorPaginationDto {
  @ApiPropertyOptional({
    description: 'Cursor for getting next or previous page',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Limit of items per page',
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @IsPositive()
  limit: number = 10;

  @ApiPropertyOptional({
    description:
      'Specifies if needs to return to previous page. Must be used with prevCursor',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isPrevious?: boolean;
}
