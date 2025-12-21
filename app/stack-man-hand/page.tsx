'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StackManHandPage() {
  const router = useRouter();

  useEffect(() => {
    // /stack-man-hand にアクセスした場合、購入ページにリダイレクト
    router.replace('/stack-man-hand/purchase');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Stack Man Hand購入ページに移動中...</p>
      </div>
    </div>
  );
}
