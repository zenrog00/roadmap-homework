import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { CursorPaginationQueryDto } from 'src/common/utils/cursor-pagination';

class MostActiveUsersAgeQueryDto {
  @ApiPropertyOptional({ description: 'Minimum age (inclusive)', example: 18 })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === '' ? undefined : Number(value),
  )
  @IsInt()
  @Min(0)
  @Max(150)
  ageFrom?: number;

  @ApiPropertyOptional({
    description: 'Maximum age (inclusive)',
    example: 65,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === '' ? undefined : Number(value),
  )
  @IsInt()
  @Min(0)
  @Max(150)
  ageTo?: number;
}

export class GetMostActiveUsersQueryDto extends IntersectionType(
  MostActiveUsersAgeQueryDto,
  CursorPaginationQueryDto,
) {}
