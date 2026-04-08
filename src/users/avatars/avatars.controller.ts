import {
  Controller,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { FileUploadDto } from 'src/common/dtos';
import type { UploadedFileDto } from 'src/file-storage';
import { AvatarsService } from './avatars.service';
import { User } from 'src/common/decorators';

@Controller('avatars/my')
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  @Post()
  @ApiOperation({
    summary: `Upload current user's avatar`,
  })
  @ApiConsumes('mutipart/form-data')
  @ApiBody({
    description: `Current user's avatar. 
    Max size of 10mb is allowed.
    Allowed mimetypes: image.png, image.jpeg, image.jpg`,
    type: FileUploadDto,
  })
  @ApiBearerAuth()
  @ApiCreatedResponse({
    description: `Current user's avatar was uploaded`,
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @User('id') userId: string,
    @UploadedFile(new ParseFilePipe())
    fileData: UploadedFileDto,
  ) {
    return await this.avatarsService.saveAvatarData(userId, fileData);
  }
}
