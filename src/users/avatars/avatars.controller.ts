import {
  Controller,
  ParseFilePipe,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  Param,
  ParseUUIDPipe,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { FileUploadDto } from 'src/common/dtos';
import type { UploadedFileDto } from 'src/file-storage';
import { AvatarsService } from './avatars.service';
import { User } from 'src/common/decorators';
import { AvatarsListResponseDto } from './dtos';

@Controller('avatars/my')
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  @Post()
  @ApiOperation({
    summary: `Upload current user's avatar`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: `Current user's avatar 
    Max size of 10mb is allowed.
    Allowed mimetypes: image.png, image.jpeg, image.jpg`,
    type: FileUploadDto,
  })
  @ApiBearerAuth()
  @ApiCreatedResponse({
    description: `Current user's avatar was uploaded`,
    schema: {
      type: 'string',
      format: 'uuid',
      description: 'UUID of uploaded avatar',
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMyAvatar(
    @User('id') userId: string,
    @UploadedFile(new ParseFilePipe())
    fileData: UploadedFileDto,
  ) {
    return await this.avatarsService.saveAvatarData(userId, fileData);
  }

  @Get()
  @ApiOperation({
    summary: `Get current user's avatars info`,
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    type: AvatarsListResponseDto,
    isArray: true,
    description: `Curent user's avatars info`,
  })
  async getMyAvatarsList(
    @User('id') userId: string,
  ): Promise<AvatarsListResponseDto[]> {
    return await this.avatarsService.getMyAvatarsList(userId);
  }

  @ApiOperation({
    summary: `Get current user's avatar download url`,
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: `Current user's avatar download url was generated`,
    schema: {
      type: 'string',
      format: 'uri',
      example: 'https://minio.example/bucket/key?X-Amz-...',
      description: `Current user's avatar download url`,
    },
  })
  @Get(':avatarId/download-url')
  async getMyAvatarDownloadUrl(
    @User('id') userId: string,
    @Param('avatarId', ParseUUIDPipe) avatarId: string,
  ) {
    return await this.avatarsService.getMyAvatarDownloadUrl(userId, avatarId);
  }

  @Delete(':avatarId')
  @ApiOperation({
    summary: `Soft deletes current user's avatar`,
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: `Current user's avatar was soft deleted`,
  })
  async deleteMyUser(
    @User('id') userId: string,
    @Param('avatarId', ParseUUIDPipe) avatarId: string,
  ) {
    await this.avatarsService.deleteMyAvatar(userId, avatarId);
  }
}
