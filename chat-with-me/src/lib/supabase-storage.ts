import { supabase } from './supabase';

// 上傳文件
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File
): Promise<{ path: string; url: string } | null> => {
  try {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};

// 上傳頭像
export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const result = await uploadFile('avatars', filePath, file);
  return result ? result.url : null;
};

// 上傳聊天圖片
export const uploadChatImage = async (chatId: string, file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${chatId}-${Date.now()}.${fileExt}`;
  const filePath = `chat-images/${fileName}`;

  const result = await uploadFile('chat-images', filePath, file);
  return result ? result.url : null;
};

// 刪除文件
export const deleteFile = async (bucket: string, path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// 創建存儲桶（如果不存在）
export const createBucketIfNotExists = async (bucket: string, isPublic = false): Promise<boolean> => {
  try {
    // 檢查存儲桶是否存在
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucket);

    if (!bucketExists) {
      // 創建存儲桶
      const { error } = await supabase.storage.createBucket(bucket, {
        public: isPublic
      });

      if (error) {
        console.error(`Error creating bucket ${bucket}:`, error);
        return false;
      }
    }

    // 如果存儲桶已存在但需要更新公共訪問權限
    if (bucketExists && isPublic) {
      const { error } = await supabase.storage.updateBucket(bucket, {
        public: isPublic
      });

      if (error) {
        console.error(`Error updating bucket ${bucket}:`, error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error(`Error creating/updating bucket ${bucket}:`, error);
    return false;
  }
};

// 初始化存儲
export const initStorage = async (): Promise<boolean> => {
  try {
    // 創建必要的存儲桶
    const avatarsCreated = await createBucketIfNotExists('avatars', true);
    const chatImagesCreated = await createBucketIfNotExists('chat-images', true);

    return avatarsCreated && chatImagesCreated;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};
