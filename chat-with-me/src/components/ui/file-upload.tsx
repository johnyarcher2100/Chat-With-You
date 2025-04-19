'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { FaUpload, FaImage, FaFile, FaTimes } from 'react-icons/fa';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: string;
  maxSize?: number; // 以 MB 為單位
  multiple?: boolean;
  preview?: boolean;
  previewUrl?: string;
  className?: string;
  buttonText?: string;
  dropzoneText?: string;
  disabled?: boolean;
}

export default function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = 'image/*',
  maxSize = 5, // 默認 5MB
  multiple = false,
  preview = true,
  previewUrl,
  className = '',
  buttonText = '選擇文件',
  dropzoneText = '拖放文件到此處',
  disabled = false
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(previewUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 處理文件選擇
  const handleFileSelect = useCallback((selectedFile: File) => {
    // 檢查文件大小
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`文件大小不能超過 ${maxSize}MB`);
      return;
    }

    // 檢查文件類型
    if (accept !== '*' && !accept.split(',').some(type => {
      if (type.includes('*')) {
        const mimeType = type.split('/')[0];
        return selectedFile.type.startsWith(mimeType);
      }
      return selectedFile.type === type;
    })) {
      setError(`只接受 ${accept} 類型的文件`);
      return;
    }

    // 清除錯誤
    setError(null);
    
    // 設置文件
    setFile(selectedFile);
    
    // 創建預覽
    if (preview) {
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
    
    // 調用回調
    onFileSelect(selectedFile);
  }, [accept, maxSize, onFileSelect, preview]);

  // 處理文件輸入變化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // 處理拖放
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // 處理拖放釋放
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // 處理按鈕點擊
  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  // 處理文件移除
  const handleFileRemove = () => {
    setFile(null);
    setFilePreview(null);
    
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    
    if (onFileRemove) {
      onFileRemove();
    }
  };

  // 獲取文件圖標
  const getFileIcon = () => {
    if (!file) return null;
    
    if (file.type.startsWith('image/')) {
      return <FaImage className="h-8 w-8 text-blue-500" />;
    }
    
    return <FaFile className="h-8 w-8 text-blue-500" />;
  };

  // 獲取文件名
  const getFileName = () => {
    if (!file) return null;
    
    const name = file.name;
    if (name.length > 20) {
      return `${name.substring(0, 10)}...${name.substring(name.length - 7)}`;
    }
    
    return name;
  };

  return (
    <div className={`relative ${className}`}>
      {/* 隱藏的文件輸入 */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />
      
      {/* 拖放區域 */}
      <div
        className={`relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-primary/50'
        } ${disabled || uploading ? 'cursor-not-allowed opacity-60' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        {filePreview && preview ? (
          // 文件預覽
          <div className="relative flex h-full w-full flex-col items-center justify-center">
            {filePreview.startsWith('data:image/') || filePreview.includes('cloudinary') ? (
              // 圖片預覽
              <div className="relative h-32 w-32 overflow-hidden rounded-lg">
                <Image
                  src={filePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              // 文件圖標
              getFileIcon()
            )}
            
            <p className="mt-2 text-sm text-gray-600">{getFileName()}</p>
            
            {/* 移除按鈕 */}
            {!disabled && !uploading && (
              <button
                type="button"
                className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileRemove();
                }}
              >
                <FaTimes className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          // 上傳提示
          <div className="flex flex-col items-center justify-center text-center">
            <FaUpload className="mb-2 h-10 w-10 text-gray-400" />
            <p className="mb-2 text-sm text-gray-600">{dropzoneText}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || uploading}
            >
              {buttonText}
            </Button>
          </div>
        )}
        
        {/* 上傳中指示器 */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        )}
      </div>
      
      {/* 錯誤消息 */}
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
