import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class BalanceOperationDto {
  @ApiProperty({
    type: String,
    example: '12.45',
    description: 'Positive decimal amount with max 2-digits precision',
    pattern: '^(?!0+(?:\\.0{1,2})?$)\\d+(?:\\.\\d{1,2})?$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?!0+(?:\.0{1,2})?$)\d+(?:\.\d{1,2})?$/, {
    message: 'amount must be positive and have max 2-digits after dot',
  })
  amount: string;
}
