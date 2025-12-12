"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  Crown,
  ArrowRight,
  Star,
  Shield,
  Users,
  BarChart3,
  Trophy,
  TrendingUp,
  MessageCircle,
  Smartphone,
  Sparkles,
  QrCode,
} from "lucide-react"
// @ts-ignore - qrcodeの型定義がない
import QRCode from "qrcode"

export default function HomePage() {
  const qrRef = useRef<HTMLCanvasElement>(null)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    if (showQR && qrRef.current) {
      QRCode.toCanvas(qrRef.current, window.location.href, {
        width: 200,
        margin: 2,
        color: {
          dark: "#1e293b",
          light: "#ffffff",
        },
      })
    }
  }, [showQR])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-800/70"></div>

        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="text-center max-w-5xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 animate-pulse">
                <Crown className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight">
              ポーカー店舗運営を
              <span className="block text-yellow-400 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent animate-pulse">
                次のレベルへ
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-slate-200 mb-12 leading-relaxed max-w-4xl mx-auto">
              スタックマンは、ポーカー店舗の効率的な運営と
              <br />
              プレイヤーの満足度向上を実現する包括的なソリューションです
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/store-login"
                className="group relative px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-300 flex items-center gap-3 shadow-2xl hover:shadow-yellow-500/25 hover:scale-105 transform"
                style={{
                  background: "linear-gradient(to right, #facc15, #f97316)",
                  color: "#ffffff",
                }}
              >
                <Crown className="w-6 h-6" style={{ color: "#ffffff" }} />
                店舗様はこちら
                <ArrowRight
                  className="w-6 h-6 group-hover:translate-x-2 transition-transform"
                  style={{ color: "#ffffff" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/50 to-orange-500/50 rounded-2xl blur-xl -z-10 group-hover:blur-2xl transition-all"></div>
              </Link>


              <Link
                href="/customer-auth"
                className="group relative bg-slate-800/80 backdrop-blur-sm hover:bg-slate-700/80 text-white border-2 border-white/50 hover:border-white/70 px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-300 flex items-center gap-3 shadow-2xl hover:shadow-white/25 hover:scale-105 transform"
              >
                <Sparkles className="w-6 h-6" />
                プレイヤー様はこちら
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative">
        <div className="absolute inset-0 bg-[url('/subtle-poker-pattern.jpg')] bg-repeat opacity-5"></div>

        <div className="relative container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-2xl shadow-lg">
                <Star className="w-10 h-10 text-white" />
              </div>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-6">なぜスタックマンなのか？</h2>
            <p className="text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              店舗運営の効率化とプレイヤー体験の向上を同時に実現する、革新的な機能をご提供します
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-7xl mx-auto">
            {/* Store Benefits */}
            <div className="group bg-gradient-to-br from-white to-slate-50 rounded-3xl p-10 shadow-2xl hover:shadow-slate-800/10 transition-all duration-500 hover:scale-105 transform border border-slate-200">
              <div className="flex items-center mb-8">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-2xl mr-6 shadow-lg">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-slate-800">店舗オーナー様のメリット</h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-2 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 mb-2">従業員全員でスタック管理</h4>
                    <p className="text-slate-600">複数スタッフでリアルタイム共有、残高管理ミスを防止</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-2 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 mb-2">伝票不要の簡単会計</h4>
                    <p className="text-slate-600">システム内で完結する会計処理で業務効率大幅アップ</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-2 rounded-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 mb-2">自動ランキング生成で集客アップ</h4>
                    <p className="text-slate-600">必要な情報を入力するだけで月間ランキングが自動生成、リピーター獲得</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-2 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 mb-2">データ分析で経営改善</h4>
                    <p className="text-slate-600">売上傾向やプレイヤー動向を分析し、戦略的な店舗運営を実現</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Player Benefits */}
            <div className="group bg-gradient-to-br from-white to-slate-50 rounded-3xl p-10 shadow-2xl hover:shadow-yellow-500/10 transition-all duration-500 hover:scale-105 transform border border-slate-200">
              <div className="flex items-center mb-8">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-2xl mr-6 shadow-lg">
                  <Smartphone className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-yellow-600">プレイヤー様のメリット</h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 mb-2">詳細な戦績データ</h4>
                    <p className="text-slate-600">勝率、平均収支、日別推移などを詳細に分析</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 mb-2">ランキング参加</h4>
                    <p className="text-slate-600">月間ランキングでプライズ獲得のチャンス</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 mb-2">ハンド分析とアドバイス</h4>
                    <p className="text-slate-600">プレイしたハンドを投稿して他のプレイヤーからアドバイスを受けられる</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 mb-2">コミュニティ参加</h4>
                    <p className="text-slate-600">他のプレイヤーとの競争と交流を楽しめる</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 mb-2">いつでもアクセス</h4>
                    <p className="text-slate-600">スマートフォンから24時間自分のデータを確認</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-slate-50 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-2xl shadow-lg">
                <Crown className="w-10 h-10 text-black" />
              </div>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-6">シンプルで透明な料金体系</h2>
            <p className="text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto">
              プレイヤー様向けの月額サービスで、より充実したポーカー体験を提供します
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-background to-card rounded-3xl p-10 shadow-2xl border border-border/50">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gradient-to-r from-primary to-secondary p-3 rounded-2xl">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  <h3 className="text-3xl font-bold text-foreground mb-4">プレイヤー月額プラン</h3>

                  <div className="flex items-center justify-center mb-6">
                    <span className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      ¥1,650
                    </span>
                    <span className="text-muted-foreground text-xl ml-3">/月</span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">（税込価格）</p>

                  <p className="text-lg text-muted-foreground mb-8 font-medium">
                    ランキング参加権とプライズ獲得のチャンス
                  </p>

                  <div className="space-y-4 text-left mb-10">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <div className="w-3 h-3 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                      <span className="text-foreground font-medium">詳細な戦績データ閲覧</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <div className="w-3 h-3 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                      <span className="text-foreground font-medium">月間ランキング参加権</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <div className="w-3 h-3 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                      <span className="text-foreground font-medium">プライズ獲得資格</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <div className="w-3 h-3 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                      <span className="text-foreground font-medium">ポイント2倍デー参加</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <div className="w-3 h-3 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                      <span className="text-foreground font-medium">ハンド投稿・アドバイス機能</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/luxury-poker-table-dark.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-800/90"></div>

        <div className="relative container mx-auto px-4 text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-r from-secondary to-accent p-6 rounded-3xl shadow-2xl animate-pulse">
              <Crown className="w-16 h-16 text-secondary-foreground" />
            </div>
          </div>

          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8 leading-tight">
            今すぐスタックマンを
            <span className="block bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
              始めませんか？
            </span>
          </h2>

          <p className="text-xl lg:text-2xl text-slate-300 mb-16 max-w-4xl mx-auto leading-relaxed">
            店舗運営の効率化とプレイヤー満足度の向上を同時に実現。
            <br />
            あなたのポーカー店舗を次のレベルへ導きます。
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
            <Link
              href="/admin"
              className="group relative px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-300 flex items-center gap-4 shadow-2xl hover:shadow-yellow-500/25 hover:scale-110 transform"
              style={{
                background: "linear-gradient(to right, #facc15, #f97316)",
                color: "#ffffff",
              }}
            >
              <Crown className="w-7 h-7" style={{ color: "#ffffff" }} />
              店舗管理を始める
              <ArrowRight
                className="w-7 h-7 group-hover:translate-x-3 transition-transform"
                style={{ color: "#ffffff" }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/50 to-orange-500/50 rounded-2xl blur-2xl -z-10 group-hover:blur-3xl transition-all"></div>
            </Link>

            <Link
              href="/customer-auth"
              className="group relative bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-300 flex items-center gap-4 shadow-2xl hover:shadow-white/25 hover:scale-110 transform"
            >
              <Sparkles className="w-7 h-7" />
              プレイヤー登録
              <ArrowRight className="w-7 h-7 group-hover:translate-x-3 transition-transform" />
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-slate-400 mb-6">または、まずはコミュニティを覗いてみませんか？</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 to-slate-800 py-12 border-t border-slate-700">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-xl">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={() => setShowQR(!showQR)}
              className="group bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/30 hover:border-white/50 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-3 mx-auto mb-4"
            >
              <QrCode className="w-5 h-5" />
              このページのQRコード
              {showQR ? "非表示" : "表示"}
            </button>

            {showQR && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 inline-block">
                <p className="text-white text-sm mb-4">このページにアクセスできるQRコード</p>
                <div className="bg-white p-4 rounded-xl">
                  <canvas ref={qrRef} className="mx-auto" />
                </div>
                <p className="text-slate-300 text-xs mt-4">スマートフォンでスキャンしてアクセス</p>
              </div>
            )}
          </div>

          <div className="mb-6">
            <Link href="/legal" className="text-slate-400 hover:text-white transition-colors underline text-sm">
              特定商取引法に基づく表記
            </Link>
          </div>

          <p className="text-slate-400 text-lg">© 2025 ポーカースタックマン. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
