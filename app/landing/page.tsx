import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Users,
  BarChart3,
  Trophy,
  Shield,
  Zap,
  TrendingUp,
  Star,
  ArrowRight,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Trophy className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">スタックマネージャー</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">
              機能
            </Link>
            <Link href="#testimonials" className="text-muted-foreground hover:text-primary transition-colors">
              お客様の声
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">
              料金
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              ポーカー業界の革新的管理システム
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6 text-balance">
              ポーカー店舗とプレイヤーを
              <br />
              <span className="text-accent">つなぐ</span>管理システム
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto text-pretty">
              効率的な店舗運営と魅力的なプレイヤー体験を実現する、次世代のポーカー管理プラットフォーム
            </p>
          </div>

          {/* Split CTA Section */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* 店舗向け */}
            <Card className="border-2 border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-2xl text-primary">店舗オーナー様</CardTitle>
                <CardDescription className="text-base">効率的な店舗運営とデータ分析で売上向上を実現</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                    <span className="text-sm">プレイヤー管理の完全自動化</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                    <span className="text-sm">リアルタイム売上・ランキング管理</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                    <span className="text-sm">詳細な経営データ分析</span>
                  </div>
                </div>
                <Link href="/" className="block">
                  <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    店舗管理を始める
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* お客さん向け */}
            <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle className="text-2xl text-primary">プレイヤー様</CardTitle>
                <CardDescription className="text-base">詳細な戦績確認とランキング参加で更なる上達を</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="text-sm">個人戦績の詳細データ確認</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="text-sm">月間ランキング参加とプライズ獲得</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="text-sm">月額1,650円（税込）でプレミアム体験</span>
                  </div>
                </div>
                <Link href="/customer-view" className="block">
                  <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                    ランキングを見る
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">充実した機能で業界をリード</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              店舗運営からプレイヤー体験まで、すべてを網羅した包括的なソリューション
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 店舗向け機能 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-accent mb-2" />
                <CardTitle className="text-lg">リアルタイム分析</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  売上、プレイヤー動向、ゲーム統計をリアルタイムで把握し、データに基づいた経営判断を支援
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-8 w-8 text-accent mb-2" />
                <CardTitle className="text-lg">セキュアな管理</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  プレイヤー情報と取引データを安全に管理。認証システムで不正アクセスを防止
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Zap className="h-8 w-8 text-accent mb-2" />
                <CardTitle className="text-lg">効率化ツール</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  手動作業を自動化し、スタッフの負担を軽減。より良い顧客サービスに集中可能
                </p>
              </CardContent>
            </Card>

            {/* プレイヤー向け機能 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-secondary mb-2" />
                <CardTitle className="text-lg">詳細な戦績分析</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  勝率、平均収支、直近の成績推移など、上達に必要なデータを詳細に分析
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Trophy className="h-8 w-8 text-secondary mb-2" />
                <CardTitle className="text-lg">ランキング参加</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  月間ランキングに参加してプライズを獲得。他のプレイヤーとの競争でモチベーション向上
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Star className="h-8 w-8 text-secondary mb-2" />
                <CardTitle className="text-lg">プレミアム体験</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  月額サービスで限定機能を利用。より深い分析とコミュニティ参加が可能
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">お客様の声</h2>
            <p className="text-lg text-muted-foreground">実際にご利用いただいている店舗様・プレイヤー様からの評価</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-base">渋谷ポーカールーム</CardTitle>
                    <CardDescription>店舗オーナー</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  「管理業務が大幅に効率化され、お客様サービスに集中できるようになりました。売上も20%向上しています。」
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">田中様</CardTitle>
                    <CardDescription>プレイヤー</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  「自分の戦績が詳しく分析できて、弱点が明確になりました。ランキング参加も楽しくて毎月通っています。」
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-base">新宿カジノバー</CardTitle>
                    <CardDescription>マネージャー</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  「データ分析機能のおかげで、どの時間帯が忙しいか、どのプレイヤーがリピーターかが一目瞭然です。」
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-accent text-accent-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">今すぐ始めませんか？</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            店舗運営の効率化とプレイヤー満足度の向上を同時に実現する、革新的なポーカー管理システム
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button size="lg" variant="secondary" className="bg-white text-accent hover:bg-white/90">
                店舗管理を始める
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/customer-view">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-accent bg-transparent"
              >
                プレイヤー登録
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">スタックマネージャー</span>
            </div>
            <div className="text-sm text-muted-foreground">© 2025 スタックマネージャー. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
