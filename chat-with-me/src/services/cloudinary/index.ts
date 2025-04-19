import { v2 as cloudinary } from 'cloudinary';
import { 
  CLOUDINARY_CLOUD_NAME, 
  CLOUDINARY_API_KEY, 
  CLOUDINARY_API_SECRET 
} from '@/config/env';

// 配置 Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true
});

// 上傳文件類型
export enum UploadType {
  AVATAR = 'avatars',
  CHAT_IMAGE = 'chat-images',
  CHAT_FILE = 'chat-files',
  GENERAL = 'general'
}

// 上傳選項
export interface UploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: any[];
  tags?: string[];
  overwrite?: boolean;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

// 上傳結果
export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width?: number;
  height?: number;
  resourceType: string;
  bytes: number;
  createdAt: Date;
}

/**
 * 上傳文件到 Cloudinary
 * @param file 文件對象或文件路徑
 * @param type 上傳類型
 * @param options 上傳選項
 * @returns 上傳結果
 */
export const uploadFile = async (
  file: File | string,
  type: UploadType = UploadType.GENERAL,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    // 設置默認選項
    const uploadOptions = {
      folder: options.folder || type,
      public_id: options.publicId,
      overwrite: options.overwrite !== undefined ? options.overwrite : true,
      resource_type: options.resourceType || 'auto',
      tags: options.tags || [type],
      transformation: options.transformation || []
    };

    // 上傳文件
    let result;
    
    if (typeof file === 'string') {
      // 如果是 URL 或文件路徑
      result = await cloudinary.uploader.upload(file, uploadOptions);
    } else {
      // 如果是 File 對象，需要先轉換為 base64
      const base64 = await fileToBase64(file);
      result = await cloudinary.uploader.upload(base64, uploadOptions);
    }

    // 返回格式化的結果
    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
      bytes: result.bytes,
      createdAt: new Date(result.created_at)
    };
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    throw error;
  }
};

/**
 * 上傳頭像
 * @param file 文件對象
 * @param userId 用戶 ID
 * @returns 上傳結果
 */
export const uploadAvatar = async (file: File, userId: string): Promise<UploadResult> => {
  return uploadFile(file, UploadType.AVATAR, {
    publicId: `user_${userId}`,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' }
    ]
  });
};

/**
 * 上傳聊天圖片
 * @param file 文件對象
 * @param chatId 聊天 ID
 * @returns 上傳結果
 */
export const uploadChatImage = async (file: File, chatId: string): Promise<UploadResult> => {
  return uploadFile(file, UploadType.CHAT_IMAGE, {
    publicId: `chat_${chatId}_${Date.now()}`,
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' }
    ]
  });
};

/**
 * 上傳聊天文件
 * @param file 文件對象
 * @param chatId 聊天 ID
 * @returns 上傳結果
 */
export const uploadChatFile = async (file: File, chatId: string): Promise<UploadResult> => {
  return uploadFile(file, UploadType.CHAT_FILE, {
    publicId: `chat_${chatId}_${Date.now()}`,
    resourceType: 'auto'
  });
};

/**
 * 刪除文件
 * @param publicId 文件公共 ID
 * @param resourceType 資源類型
 * @returns 是否成功
 */
export const deleteFile = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    return false;
  }
};

/**
 * 獲取文件 URL
 * @param publicId 文件公共 ID
 * @param options 轉換選項
 * @returns 文件 URL
 */
export const getFileUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    format?: string;
    quality?: number;
  } = {}
): string => {
  const transformations = [];
  
  if (options.width || options.height) {
    transformations.push({
      width: options.width,
      height: options.height,
      crop: options.crop || 'fill'
    });
  }
  
  if (options.format || options.quality) {
    transformations.push({
      fetch_format: options.format,
      quality: options.quality
    });
  }
  
  return cloudinary.url(publicId, {
    secure: true,
    transformation: transformations
  });
};

/**
 * 將 File 對象轉換為 base64 字符串
 * @param file 文件對象
 * @returns base64 字符串
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
