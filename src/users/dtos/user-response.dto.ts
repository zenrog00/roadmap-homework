import { ApiProperty, OmitType } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class UserResponseDto extends OmitType(UserDto, ['password'] as const) {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;
}
