// 環境變量配置

// Supabase 配置
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// AI API 密鑰
export const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
export const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';

// Cloudinary 配置
export const CLOUDINARY_URL = process.env.CLOUDINARY_URL || '';
export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

// 其他 API 密鑰
export const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
export const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

// 檢查必要的環境變量是否已設置
export const checkRequiredEnvVars = (): boolean => {
  const requiredVars = [
    { name: 'SUPABASE_URL', value: SUPABASE_URL },
    { name: 'SUPABASE_ANON_KEY', value: SUPABASE_ANON_KEY },
    { name: 'DEEPSEEK_API_KEY', value: DEEPSEEK_API_KEY },
    { name: 'CLAUDE_API_KEY', value: CLAUDE_API_KEY },
    { name: 'CLOUDINARY_CLOUD_NAME', value: CLOUDINARY_CLOUD_NAME },
    { name: 'CLOUDINARY_API_KEY', value: CLOUDINARY_API_KEY },
    { name: 'CLOUDINARY_API_SECRET', value: CLOUDINARY_API_SECRET },
  ];

  let allPresent = true;
  const missingVars: string[] = [];

  requiredVars.forEach(({ name, value }) => {
    if (!value) {
      allPresent = false;
      missingVars.push(name);
    }
  });

  if (!allPresent) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return allPresent;
};

// 檢查 AI API 密鑰是否已設置
export const hasDeepSeekApiKey = (): boolean => !!DEEPSEEK_API_KEY;
export const hasClaudeApiKey = (): boolean => !!CLAUDE_API_KEY;

// 檢查 Cloudinary 配置是否已設置
export const hasCloudinaryConfig = (): boolean => {
  return !!CLOUDINARY_CLOUD_NAME && !!CLOUDINARY_API_KEY && !!CLOUDINARY_API_SECRET;
};
