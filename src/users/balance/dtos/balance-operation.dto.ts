import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class BalanceOperationDto {
  @ApiProperty({
    type: String,
    example: '12.45',
    description: 'Decimal amount with maximum 2-digits precision',
    pattern: '^\\d+(\\.\\d{1,2})?$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message:
      'amount must be a positive decimal string with max 2-digits after dot',
  })
  amount: string;
}
