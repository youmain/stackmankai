import React from 'react'
import { Button } from "@/components/ui/button"
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        youmain
        <span className="block text-xl">ユメイン</span>
      </h1>
      
      <div className="space-y-4 w-full max-w-xs">
        <Button asChild className="w-full bg-green-500 hover:bg-green-600 text-white py-4">
          <Link href="/register/fan">ファンの方のユーザー登録</Link>
        </Button>
        
        <Button asChild className="w-full bg-red-500 hover:bg-red-600 text-white py-4">
          <Link href="/register/influencer">インフルエンサーの方のユーザー登録</Link>
        </Button>
      </div>
      
      <p className="mt-8 text-sm text-gray-600">
        すでにアカウントをお持ちの方は
        <Link href="/login" className="text-blue-500 hover:underline ml-1">
          こちら
        </Link>
      </p>
    </div>
  )
}