import {
  Controller,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('avatars')
export class AvatarsController {
  @Post()
  @UseInterceptors(FileInterceptor('avatar'))
  uploadAvatar(
    @UploadedFile(new ParseFilePipe())
    file: Express.Multer.File,
  ) {
    console.log(file);
  }
}
