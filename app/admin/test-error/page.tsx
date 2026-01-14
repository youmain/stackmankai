"use client";

import { handleError } from "@/lib/error-handler";
import { Button } from "@/components/ui/button";

export default function TestErrorPage() {
  const triggerError = () => {
    try {
      throw new Error("テスト用の意図的なエラーです。監視システムが正しく動作するか確認しています。");
    } catch (error) {
      handleError(error, "TestErrorPage");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">エラー監視テストページ</h1>
      <Button onClick={triggerError} variant="destructive">
        エラーを発生させる
      </Button>
    </div>
  );
}
