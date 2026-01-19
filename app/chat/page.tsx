"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    // /chatへの直接アクセスを/customer-viewにリダイレクト
    // 実際のチャット機能はcustomer-view内でviewMode='chat'として表示されるため
    router.replace('/customer-view');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">チャット画面に移動しています...</p>
    </div>
  );
}
