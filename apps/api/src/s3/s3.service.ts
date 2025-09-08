import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { 
  S3Image, 
  S3UploadRequest, 
  S3UploadResponse 
} from '@repo/contracts';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly cdnUrl: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get('AWS_REGION', 'ap-northeast-2');
    this.bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
    const cloudfrontUrl = this.configService.get('AWS_CLOUDFRONT_URL');
    
    // 환경 변수 로깅
    this.logger.log(`S3 설정 - Region: ${region}, Bucket: ${this.bucketName}, CloudFront: ${cloudfrontUrl}`);
    
    if (!this.bucketName) {
      this.logger.error('AWS_S3_BUCKET_NAME 환경 변수가 설정되지 않았습니다!');
    }
    
    this.s3Client = new S3Client({
      region,
    });
    
    this.cdnUrl = cloudfrontUrl || 
                  `https://${this.bucketName}.s3.${region}.amazonaws.com`;
  }

  /**
   * 이미지를 S3에 업로드
   */
  async uploadImage(request: S3UploadRequest): Promise<S3UploadResponse> {
    try {
      console.log('S3Service.uploadImage 시작:', {
        filename: request.filename,
        mimeType: request.mimeType,
        path: request.path,
        fileType: typeof request.file,
        fileSize: request.file?.length || 0
      });
      
      const { file, filename, mimeType, path = 'products', resizeOptions } = request;
      
      // 파일을 Buffer로 변환
      let fileBuffer: Buffer;
      if (typeof file === 'string') {
        fileBuffer = Buffer.from(file, 'base64');
      } else {
        fileBuffer = file;
      }
      
      console.log('파일 버퍼 변환 완료:', {
        bufferSize: fileBuffer.length,
        bufferType: typeof fileBuffer
      });

      // 이미지 리사이징 (선택사항)
      let processedBuffer = fileBuffer;
      let dimensions: { width: number; height: number } | undefined;

      if (resizeOptions && this.isImageMimeType(mimeType)) {
        const sharpInstance = sharp(fileBuffer);
        const metadata = await sharpInstance.metadata();
        
        if (metadata.width && metadata.height) {
          dimensions = { width: metadata.width, height: metadata.height };
        }

        // 리사이징 옵션이 있으면 적용
        if (resizeOptions.width || resizeOptions.height) {
          sharpInstance.resize(resizeOptions.width, resizeOptions.height, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        }

        // 품질 조정 (JPEG인 경우)
        if (mimeType === 'image/jpeg' && resizeOptions.quality) {
          sharpInstance.jpeg({ quality: resizeOptions.quality });
        }

        processedBuffer = await sharpInstance.toBuffer();
      }

      // S3 키 생성
      const fileExtension = this.getFileExtension(filename, mimeType);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      const s3Key = `${path}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${uniqueFilename}`;

      console.log('S3 업로드 준비:', {
        bucketName: this.bucketName,
        s3Key,
        processedBufferSize: processedBuffer.length,
        mimeType,
        cdnUrl: this.cdnUrl
      });

      // S3에 업로드
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: processedBuffer,
        ContentType: mimeType,
        ContentLength: processedBuffer.length,
        ServerSideEncryption: 'AES256',  
        CacheControl: 'public, max-age=31536000, immutable'
      });

      console.log('S3 PutObjectCommand 실행 중...');
      await this.s3Client.send(command);
      console.log('S3 업로드 성공!');

      const cdnUrl = `${this.cdnUrl}/${s3Key}`;

      this.logger.log(`Image uploaded successfully: ${s3Key}`);

      return {
        s3Key,
        cdnUrl,
        size: processedBuffer.length,
        dimensions,
      };
    } catch (error) {
      console.error('S3 업로드 실패:', {
        error: error.message,
        stack: error.stack,
        filename: request.filename,
        bucketName: this.bucketName,
        region: this.configService.get('AWS_REGION')
      });
      this.logger.error('Failed to upload image to S3:', error);
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  /**
   * 여러 이미지를 일괄 업로드
   */
  async uploadMultipleImages(
    requests: S3UploadRequest[],
    path?: string
  ): Promise<S3UploadResponse[]> {
    const uploadPromises = requests.map((request, index) => 
      this.uploadImage({
        ...request,
        path: path || `products/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      })
    );

    return Promise.all(uploadPromises);
  }

  /**
   * S3에서 이미지 삭제
   */
  async deleteImage(s3Key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(command);
      this.logger.log(`Image deleted successfully: ${s3Key}`);
    } catch (error) {
      this.logger.error('Failed to delete image from S3:', error);
      throw new Error(`S3 delete failed: ${error.message}`);
    }
  }

  /**
   * 여러 이미지를 일괄 삭제
   */
  async deleteMultipleImages(s3Keys: string[]): Promise<void> {
    const deletePromises = s3Keys.map(key => this.deleteImage(key));
    await Promise.all(deletePromises);
  }

  /**
   * S3Image 객체 생성
   */
  createS3Image(
    uploadResponse: S3UploadResponse,
    originalName?: string,
    order?: number
  ): S3Image {
    return {
      s3Key: uploadResponse.s3Key,
      cdnUrl: uploadResponse.cdnUrl,
      mime: this.getMimeTypeFromS3Key(uploadResponse.s3Key),
      size: uploadResponse.size,
      originalName,
      width: uploadResponse.dimensions?.width,
      height: uploadResponse.dimensions?.height,
      uploadedAt: new Date().toISOString(),
      order,
    };
  }

  /**
   * ProductImages 배열 생성
   */
  createProductImages(
    uploadResponses: S3UploadResponse[],
    originalNames?: string[]
  ): S3Image[] {
    return uploadResponses.map((response, index) => 
      this.createS3Image(
        response,
        originalNames?.[index],
        index
      )
    );
  }

  /**
   * 이미지 MIME 타입인지 확인
   */
  private isImageMimeType(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * 파일 확장자 추출
   */
  private getFileExtension(filename: string, mimeType: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot !== -1) {
      return filename.substring(lastDot);
    }

    // MIME 타입에서 확장자 추출
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
    };

    return mimeToExt[mimeType] || '.jpg';
  }

  /**
   * S3 키에서 MIME 타입 추출
   */
  private getMimeTypeFromS3Key(s3Key: string): string {
    const extension = s3Key.substring(s3Key.lastIndexOf('.'));
    const extToMime: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };

    return extToMime[extension.toLowerCase()] || 'image/jpeg';
  }
}