import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { BalanceOperationDto } from './balance-operation.dto';

export class BalanceTransferDto extends BalanceOperationDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Counterparty user identifier',
  })
  @IsUUID()
  counterpartyUserId: string;
}
