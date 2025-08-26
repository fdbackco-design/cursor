import { diskStorage } from 'multer';
import { extname } from 'path';

export const uploadConfig = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      return cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 20, // 최대 파일 개수
    fieldSize: 100 * 1024 * 1024, // 필드 크기 제한
  },
};
