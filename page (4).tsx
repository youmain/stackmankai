'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Gift, Users, Library, Star, MessageCircle, TrendingUp, Palette, Share2 } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8">YOUMAINへようこそ</h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <Library className="h-8 w-8 mb-2 text-purple-600" />
              <CardTitle>インフルエンサーとしてログイン</CardTitle>
              <CardDescription>インフルエンサーアカウントでログインします</CardDescription>
            </CardHeader>
            <CardContent>
              <p>インフルエンサー向けの特別な機能にアクセスできます</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <Link href="/dashboard/influencer">
                  インフルエンサーダッシュボードへ
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <Library className="h-8 w-8 mb-2 text-purple-600" />
              <CardTitle>ファンとしてログイン</CardTitle>
              <CardDescription>ファンアカウントでログインします</CardDescription>
            </CardHeader>
            <CardContent>
              <p>お気に入りのインフルエンサーのコンテンツにアクセスできます</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="secondary" asChild>
                <Link href="/dashboard/fan">
                  ファンダッシュボードへ
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
