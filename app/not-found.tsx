import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <AlertCircle className="h-6 w-6 text-red-500" />
            404 - ページが見つかりません
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            お探しのページは存在しないか、移動した可能性があります。
          </p>
          <div className="flex gap-2">
            <Link href="/" className="flex-1">
              <Button className="w-full">トップページへ</Button>
            </Link>
            <Link href="/admin" className="flex-1">
              <Button variant="outline" className="w-full">
                管理画面へ
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
