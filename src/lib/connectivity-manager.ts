'use client';

import { useState, useEffect } from 'react';

/**
 * MyCodexVantaOS 運行時模式定義
 * native: 全離線/內網模式，嚴禁請求外部 API
 * connected: 雲端連線模式，允許訪問外部服務
 * hybrid: 混合模式，優先使用本地資源，必要時嘗試連線
 */
export type RuntimeMode = 'native' | 'connected' | 'hybrid';

export function useConnectivity() {
  const [mode, setMode] = useState<RuntimeMode>('native');
  const [isOnline, setIsOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkConnectivity() {
      setIsChecking(true);

      // 1. 檢查瀏覽器網絡狀態
      const online = typeof navigator !== 'undefined' ? navigator.onLine : false;
      setIsOnline(online);

      if (!online) {
        setMode('native');
        setIsChecking(false);
        return;
      }

      // 2. 探測外部 API 可達性 (例如探測 Google AI 服務)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
          method: 'GET',
          signal: controller.signal,
          mode: 'no-cors', // 僅測試連通性
        });

        clearTimeout(timeoutId);

        // 如果能連通且有配置 Key，進入 Connected 模式，否則維持 Native
        const hasKey = !!process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        setMode(hasKey ? 'connected' : 'native');
      } catch (e) {
        // 連不通則強制降級至 Native
        setMode('native');
      } finally {
        setIsChecking(false);
      }
    }

    checkConnectivity();

    // 監聽網絡變更事件
    window.addEventListener('online', checkConnectivity);
    window.addEventListener('offline', () => {
      setIsOnline(false);
      setMode('native');
    });

    return () => {
      window.removeEventListener('online', checkConnectivity);
      window.removeEventListener('offline', checkConnectivity);
    };
  }, []);

  return { mode, isOnline, isChecking };
}
