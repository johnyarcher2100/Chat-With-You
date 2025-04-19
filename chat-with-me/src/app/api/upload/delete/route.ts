import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { deleteFile } from '@/services/cloudinary';

// 處理文件刪除
export async function DELETE(request: NextRequest) {
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
    
    // 解析請求數據
    const { publicId, resourceType = 'image' } = await request.json();
    
    if (!publicId) {
      return NextResponse.json(
        { error: '未提供文件 ID' },
        { status: 400 }
      );
    }
    
    // 刪除文件
    const success = await deleteFile(publicId, resourceType as any);
    
    if (!success) {
      return NextResponse.json(
        { error: '刪除文件失敗' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    
    return NextResponse.json(
      { error: error.message || '刪除文件時出錯' },
      { status: 500 }
    );
  }
}
