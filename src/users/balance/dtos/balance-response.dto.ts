import { PickType } from '@nestjs/swagger';
import { UserMyResponseDto } from 'src/users/dtos';

export class BalanceResponseDto extends PickType(UserMyResponseDto, [
  'balance',
] as const) {}
