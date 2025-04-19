'use client';

import { useState, useCallback } from 'react';
import { UploadType } from '@/services/cloudinary';

interface UploadOptions {
  type?: string;
  chatId?: string;
  onProgress?: (progress: number) => void;
}

interface UploadResult {
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

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // 上傳文件
  const uploadFile = useCallback(async (
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult | null> => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);
      
      // 創建表單數據
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.type) {
        formData.append('type', options.type);
      }
      
      if (options.chatId) {
        formData.append('chatId', options.chatId);
      }
      
      // 創建 XMLHttpRequest
      const xhr = new XMLHttpRequest();
      
      // 設置進度回調
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setProgress(progress);
          
          if (options.onProgress) {
            options.onProgress(progress);
          }
        }
      };
      
      // 發送請求
      const response = await new Promise<UploadResult>((resolve, reject) => {
        xhr.open('POST', '/api/upload');
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (error) {
              reject(new Error('解析響應時出錯'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || '上傳文件失敗'));
            } catch (error) {
              reject(new Error('上傳文件失敗'));
            }
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('網絡錯誤'));
        };
        
        xhr.send(formData);
      });
      
      return response;
    } catch (err: any) {
      setError(err.message || '上傳文件時出錯');
      return null;
    } finally {
      setUploading(false);
    }
  }, []);
  
  // 上傳頭像
  const uploadAvatar = useCallback(async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult | null> => {
    return uploadFile(file, {
      type: 'avatar',
      onProgress
    });
  }, [uploadFile]);
  
  // 上傳聊天圖片
  const uploadChatImage = useCallback(async (
    file: File,
    chatId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult | null> => {
    return uploadFile(file, {
      type: 'chat-image',
      chatId,
      onProgress
    });
  }, [uploadFile]);
  
  // 上傳聊天文件
  const uploadChatFile = useCallback(async (
    file: File,
    chatId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult | null> => {
    return uploadFile(file, {
      type: 'chat-file',
      chatId,
      onProgress
    });
  }, [uploadFile]);
  
  // 刪除文件
  const deleteFile = useCallback(async (
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/upload/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          publicId,
          resourceType
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '刪除文件失敗');
      }
      
      return true;
    } catch (err: any) {
      setError(err.message || '刪除文件時出錯');
      return false;
    }
  }, []);
  
  return {
    uploading,
    progress,
    error,
    uploadFile,
    uploadAvatar,
    uploadChatImage,
    uploadChatFile,
    deleteFile
  };
};
