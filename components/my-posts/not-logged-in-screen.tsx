"use client"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, AlertCircle } from "lucide-react"
import Link from "next/link"

export function NotLoggedInScreen() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-4">
        <Link href="/customer-view">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Home className="w-4 h-4" />
            マイページに戻る
          </Button>
        </Link>
      </div>
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>ログインが必要です。マイページからログインしてください。</AlertDescription>
      </Alert>
    </div>
  )
}
