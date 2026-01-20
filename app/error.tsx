"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            エラーが発生しました
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            申し訳ございません。予期しないエラーが発生しました。
          </p>
          <div className="bg-red-50 p-3 rounded text-xs font-mono text-red-800 overflow-auto max-h-32">
            {error.message || "Unknown error"}
            {error.digest && <div className="mt-1 text-red-400">Digest: {error.digest}</div>}
          </div>
          <Button onClick={() => reset()} className="w-full">
            再試行
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
