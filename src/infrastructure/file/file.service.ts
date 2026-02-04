import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { writeFile, unlink, rename } from 'fs/promises';
import { join, extname } from 'path';
import { config } from 'src/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileService {
  private readonly uploadPath = join(process.cwd(), config.FILE_UPLOAD_NAME);

  private readonly LIMITS = {
    IMAGE: 5 * 1024 * 1024, // 5 MB
    DOCUMENT: 5 * 1024 * 1024, // 5 MB
    VIDEO: 50 * 1024 * 1024, // 50 MB
  };

  private readonly ALLOWED_MIME_TYPES = {
    IMAGE: [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
      'image/svg+xml',
    ],
    DOCUMENT: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    VIDEO: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
  };

  constructor() {
    this.ensureDirectoryExists();
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    this.validateFile(file);

    const fileName = this.generateFileName(file.originalname);
    const fullPath = join(this.uploadPath, fileName);

    try {
      if (file.buffer) {
        await writeFile(fullPath, file.buffer);
      } else if (file.path) {
        await rename(file.path, fullPath);
      } else {
        throw new Error('File data is missing');
      }

      return `${config.BASE_URL}/${config.FILE_UPLOAD_NAME}/${fileName}`;
    } catch (error) {
      throw new InternalServerErrorException(
        `File write error: ${error.message}`,
      );
    }
  }

  async saveMultipleFiles(files: Express.Multer.File[]): Promise<string[]> {
    if (!files?.length) return [];
    return Promise.all(files.map((file) => this.saveFile(file)));
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    const fileName = this.extractFileName(fileUrl);
    if (!fileName) return;

    const fullPath = join(this.uploadPath, fileName);

    try {
      if (existsSync(fullPath)) {
        await unlink(fullPath);
      }
    } catch (error) {
      throw new InternalServerErrorException(
        `File deletion error: ${error.message}`,
      );
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const { mimetype, size } = file;

    if (this.ALLOWED_MIME_TYPES.IMAGE.includes(mimetype)) {
      if (size > this.LIMITS.IMAGE)
        throw new BadRequestException('Rasm hajmi 5MB dan oshmasligi kerak');
      return;
    }

    if (this.ALLOWED_MIME_TYPES.DOCUMENT.includes(mimetype)) {
      if (size > this.LIMITS.DOCUMENT)
        throw new BadRequestException('File hajmi 5MB dan oshmasligi kerak');
      return;
    }

    if (this.ALLOWED_MIME_TYPES.VIDEO.includes(mimetype)) {
      if (size > this.LIMITS.VIDEO)
        throw new BadRequestException('Video hajmi 50MB dan oshmasligi kerak');
      return;
    }

    throw new BadRequestException(
      `File formati qo'llab-quvvatlanmaydi: ${mimetype}`,
    );
  }

  private generateFileName(originalName: string): string {
    return `${uuidv4()}${extname(originalName)}`;
  }

  private extractFileName(url: string): string | null {
    const parts = url.split(`${config.BASE_URL}/${config.FILE_UPLOAD_NAME}/`);
    return parts.length > 1 ? parts[1] : null;
  }

  private ensureDirectoryExists(): void {
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }
  }
}
