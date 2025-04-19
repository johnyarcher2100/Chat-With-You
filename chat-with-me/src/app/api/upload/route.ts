import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { 
  uploadFile, 
  uploadAvatar, 
  uploadChatImage, 
  uploadChatFile, 
  UploadType 
} from '@/services/cloudinary';

// 處理文件上傳
export async function POST(request: NextRequest) {
  try {
    // 獲取 Supabase 客戶端
    const supabase = createServerClient();
    
    // 獲取當前用戶
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: '未授權' },
        { status: 401 }
      );
    }
    
    // 解析表單數據
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'general';
    const chatId = formData.get('chatId') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: '未提供文件' },
        { status: 400 }
      );
    }
    
    // 檢查文件大小（最大 10MB）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '文件大小不能超過 10MB' },
        { status: 400 }
      );
    }
    
    // 根據類型上傳文件
    let result;
    
    switch (type) {
      case 'avatar':
        result = await uploadAvatar(file, user.id);
        
        // 更新用戶頭像
        await supabase
          .from('profiles')
          .update({ avatar_url: result.secureUrl })
          .eq('id', user.id);
        
        break;
        
      case 'chat-image':
        if (!chatId) {
          return NextResponse.json(
            { error: '未提供聊天 ID' },
            { status: 400 }
          );
        }
        
        result = await uploadChatImage(file, chatId);
        break;
        
      case 'chat-file':
        if (!chatId) {
          return NextResponse.json(
            { error: '未提供聊天 ID' },
            { status: 400 }
          );
        }
        
        result = await uploadChatFile(file, chatId);
        break;
        
      default:
        result = await uploadFile(file, UploadType.GENERAL);
        break;
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error uploading file:', error);
    
    return NextResponse.json(
      { error: error.message || '上傳文件時出錯' },
      { status: 500 }
    );
  }
}

// 獲取上傳簽名（用於客戶端直接上傳）
export async function GET(request: NextRequest) {
  try {
    // 獲取 Supabase 客戶端
    const supabase = createServerClient();
    
    // 獲取當前用戶
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: '未授權' },
        { status: 401 }
      );
    }
    
    // 獲取查詢參數
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'general';
    
    // 創建上傳參數
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = type;
    
    // 返回上傳參數
    return NextResponse.json({
      timestamp,
      folder,
      apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    });
  } catch (error: any) {
    console.error('Error generating upload signature:', error);
    
    return NextResponse.json(
      { error: error.message || '生成上傳簽名時出錯' },
      { status: 500 }
    );
  }
}
