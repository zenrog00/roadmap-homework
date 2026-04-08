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

@Controller('avatars')
export class AvatarsController {
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
  uploadAvatar(
    @UploadedFile(new ParseFilePipe())
    file: Express.Multer.File,
  ) {
    console.log(file);
  }
}
