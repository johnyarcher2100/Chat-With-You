import os
from supabase import create_client, Client
from dotenv import load_dotenv

# 載入環境變量
load_dotenv('.env.local')

# 獲取 Supabase URL 和 API Key
supabase_url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')

print(f"Supabase URL: {supabase_url}")
print(f"Supabase Key: {supabase_key[:10]}...{supabase_key[-10:]}")

# 創建 Supabase 客戶端
supabase: Client = create_client(supabase_url, supabase_key)

try:
    print("\n測試 Supabase 連接...")

    # 嘗試獲取系統健康狀態
    print("\n嘗試獲取 Supabase 系統健康狀態...")

    # 使用 REST API 直接發送請求
    import requests

    health_url = f"{supabase_url}/rest/v1/"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}"
    }

    response = requests.get(health_url, headers=headers)

    # 打印結果
    print(f"\n響應狀態碼: {response.status_code}")
    print(f"\n響應內容: {response.text}")

    if response.status_code == 200:
        print("\n成功! Supabase REST API 可以正常連接。")
    else:
        print("\n警告: Supabase REST API 連接可能有問題。")

    # 嘗試獲取用戶信息
    try:
        print("\n嘗試獲取當前用戶信息...")
        user = supabase.auth.get_user()
        print(f"成功! 獲取到用戶信息: {user}")
    except Exception as e:
        print(f"獲取用戶信息失敗: {str(e)}")

    print("\n連接測試完成! Supabase 連接成功。")

except Exception as e:
    print(f"\n連接失敗: {str(e)}")
