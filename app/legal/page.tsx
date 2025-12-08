import Link from "next/link"
import { ArrowLeft, Crown, Mail, MapPin, CreditCard, RefreshCw } from "lucide-react"

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-secondary py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="flex items-center gap-2 text-white hover:text-white/80 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              トップページに戻る
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white">特定商取引法に基づく表記</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-background to-card rounded-3xl p-8 lg:p-12 shadow-2xl border border-border/50">
            {/* 事業者情報 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6 flex items-center gap-3">
                <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                事業者情報
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground mb-1">事業者名</h3>
                    <p className="text-muted-foreground">北治隆介</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground mb-1">代表者</h3>
                    <p className="text-muted-foreground">北治隆介</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground mb-1">所在地</h3>
                    <p className="text-muted-foreground">
                      〒640-8390
                      <br />
                      和歌山県和歌山市有本415の27
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground mb-1">メールアドレス</h3>
                    <p className="text-muted-foreground">r09050580098@gmail.com</p>
                  </div>
                </div>
              </div>
            </section>

            {/* サービス内容 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6 flex items-center gap-3">
                <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                サービス内容
              </h2>

              <div className="p-6 rounded-xl bg-muted/50">
                <h3 className="font-bold text-lg text-foreground mb-4">提供サービス</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• ポーカー店舗管理システムの提供</li>
                  <li>• プレイヤー向けランキングサービス（月額制）</li>
                  <li>• スタック管理・会計システム</li>
                  <li>• データ分析・レポート機能</li>
                </ul>
              </div>
            </section>

            {/* 料金・支払い */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6 flex items-center gap-3">
                <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                料金・支払い方法
              </h2>

              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-muted/50">
                  <h3 className="font-bold text-lg text-foreground mb-4">料金体系</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                      <span className="font-medium">プレイヤー月額プラン</span>
                      <span className="font-bold text-lg">1,650円（税込）/月</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                      <span className="font-medium">店舗管理システム</span>
                      <span className="font-bold text-lg">無料</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-muted/50">
                  <h3 className="font-bold text-lg text-foreground mb-4">支払い方法</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• クレジットカード（Visa、Mastercard、JCB、American Express）</li>
                    <li>• デビットカード</li>
                    <li>• キャリア決済（docomo、au、SoftBank）</li>
                    <li>• Apple Pay / Google Pay</li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl bg-muted/50">
                  <h3 className="font-bold text-lg text-foreground mb-4">請求について</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• 月額料金は毎月同日に自動課金されます</li>
                    <li>• 初回登録時は日割り計算となります</li>
                    <li>• 料金には消費税が含まれています</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 解約・返金 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6 flex items-center gap-3">
                <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
                解約・返金について
              </h2>

              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-muted/50">
                  <h3 className="font-bold text-lg text-foreground mb-4">解約について</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• いつでもマイページから解約手続きが可能です</li>
                    <li>• 解約手続き完了後、次回課金日から停止されます</li>
                    <li>• 解約手数料は一切かかりません</li>
                    <li>• 解約後も課金期間終了まではサービスをご利用いただけます</li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl bg-muted/50">
                  <h3 className="font-bold text-lg text-foreground mb-4">返金について</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• 原則として、一度お支払いいただいた料金の返金は行いません</li>
                    <li>• システム障害等、当社都合による場合は返金対象となります</li>
                    <li>• 返金が発生する場合は、お支払い方法と同じ方法で返金いたします</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* その他 */}
            <section>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6 flex items-center gap-3">
                <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                その他
              </h2>

              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-muted/50">
                  <h3 className="font-bold text-lg text-foreground mb-4">個人情報の取り扱い</h3>
                  <p className="text-muted-foreground">
                    お客様の個人情報は、プライバシーポリシーに基づき適切に管理・保護いたします。
                    第三者への提供は、法令に基づく場合を除き一切行いません。
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-muted/50">
                  <h3 className="font-bold text-lg text-foreground mb-4">免責事項</h3>
                  <p className="text-muted-foreground">
                    当サービスの利用により生じた損害について、当社は一切の責任を負いません。
                    サービス内容は予告なく変更される場合があります。
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-muted/50">
                  <h3 className="font-bold text-lg text-foreground mb-4">準拠法・管轄裁判所</h3>
                  <p className="text-muted-foreground">
                    本サービスに関する紛争については、日本法を準拠法とし、
                    和歌山地方裁判所を第一審の専属的合意管轄裁判所とします。
                  </p>
                </div>
              </div>
            </section>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground text-sm">最終更新日：2025年9月7日</p>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/admin-access"
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors"
              >
                運営用
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
