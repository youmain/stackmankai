"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { useMembership } from "@/hooks/use-membership"
import { LogOut, User, Receipt, Users, TrendingUp, Menu, HelpCircle, Trophy, Settings, QrCode, UserPlus, Star, Key, Plus, FileText } from 'lucide-react'
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { useState } from "react"
import { QRCodeModal } from "@/components/qr-code-modal"

export function Header() {
  const { userName, signOut } = useAuth()
  const { subscriptionStatus } = useMembership()
  const isPaidMember = subscriptionStatus === "active"
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("ログアウトエラー:", error)
    }
  }

  return (
    <>
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-black">スタックマン！</h1>
            </div>
            <div className="flex items-center space-x-4">
              {userName && subscriptionStatus === "active" && (
                <Link href="/create-post">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">新規投稿</span>
                  </Button>
                </Link>
              )}
              {userName && (
                <>
                  <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{userName}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="flex items-center space-x-2"
                  >
                    <Menu className="h-4 w-4" />
                    <span className="hidden sm:inline">メニュー</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle className="text-lg">メニュー</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">管理機能</h3>
              <div className="space-y-2">
                {subscriptionStatus === "active" && (
                  <Link href="/posts" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant={pathname === "/posts" ? "default" : "ghost"}
                      className="w-full justify-start text-base py-3"
                    >
                      <FileText className="h-5 w-5 mr-3" />
                      投稿一覧
                    </Button>
                  </Link>
                )}
                <Link href="/players" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant={pathname === "/players" ? "default" : "ghost"}
                    className="w-full justify-start text-base py-3"
                  >
                    <Users className="h-5 w-5 mr-3" />
                    プレイヤー管理
                  </Button>
                </Link>
                <Link href="/receipts" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant={pathname === "/receipts" ? "default" : "ghost"}
                    className="w-full justify-start text-base py-3"
                  >
                    <Receipt className="h-5 w-5 mr-3" />
                    伝票管理
                  </Button>
                </Link>
                <Link href="/daily-sales" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant={pathname === "/daily-sales" ? "default" : "ghost"}
                    className="w-full justify-start text-base py-3"
                  >
                    <TrendingUp className="h-5 w-5 mr-3" />
                    売上
                  </Button>
                </Link>
                <Link href="/rankings" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant={pathname === "/rankings" ? "default" : "ghost"}
                    className="w-full justify-start text-base py-3"
                  >
                    <Trophy className="h-5 w-5 mr-3" />
                    ランキング
                  </Button>
                </Link>
                <Link href="/store-ranking-settings" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant={pathname === "/store-ranking-settings" ? "default" : "ghost"}
                    className="w-full justify-start text-base py-3"
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    店舗設定
                  </Button>
                </Link>
                <Link href="/password-change" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant={pathname === "/password-change" ? "default" : "ghost"}
                    className="w-full justify-start text-base py-3"
                  >
                    <Key className="h-5 w-5 mr-3" />
                    ログインパスワード変更
                  </Button>
                </Link>
                <Link href="/stackman-password-change" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant={pathname === "/stackman-password-change" ? "default" : "ghost"}
                    className="w-full justify-start text-base py-3"
                  >
                    <Key className="h-5 w-5 mr-3" />
                    スタックマンパスワード変更
                  </Button>
                </Link>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">サービス</h3>
              <div className="space-y-2">
                <Link href="/help" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant={pathname === "/help" ? "default" : "ghost"}
                    className="w-full justify-start text-base py-3"
                  >
                    <HelpCircle className="h-5 w-5 mr-3" />
                    使い方
                  </Button>
                </Link>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">お客さん向け</h3>
              <div className="space-y-2">
                <Link href="/customer-auth" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant={pathname === "/customer-auth" ? "default" : "ghost"}
                    className="w-full justify-start text-base py-3 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                  >
                    <UserPlus className="h-5 w-5 mr-3" />
                    お客さん認証
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-base py-3 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  onClick={() => {
                    setIsQRModalOpen(true)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  <QrCode className="h-5 w-5 mr-3" />
                  お客さん用QR
                </Button>
                <Link href="/influencer" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant={pathname === "/influencer" ? "default" : "ghost"}
                    className="w-full justify-start text-base py-3 bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                  >
                    <Star className="h-5 w-5 mr-3" />
                    インフルエンサー
                  </Button>
                </Link>
              </div>
            </div>

            <Separator />

            <div className="flex items-center space-x-2 text-sm text-muted-foreground px-3 py-2 sm:hidden">
              <User className="h-4 w-4" />
              <span>{userName}</span>
            </div>

            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
    </>
  )
}
