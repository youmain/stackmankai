"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Save, AlertCircle } from "lucide-react"
import Link from "next/link"
import { PostCreationStep1 } from "@/components/post-creation/step-1-situation"
import { PostCreationStep2 } from "@/components/post-creation/step-2-preflop"
import { PostCreationStep3 } from "@/components/post-creation/step-3-flop"
import { PostCreationStep4 } from "@/components/post-creation/step-4-turn"
import { PostCreationStep5 } from "@/components/post-creation/step-5-river"
import { PostCreationStep6 } from "@/components/post-creation/step-6-reflection"
import { VisibilitySettings } from "@/components/post-creation/visibility-settings"
import { createPost } from "@/lib/firestore"
import type { PostData, SituationData, PreflopData, FlopData, TurnData, RiverData, ReflectionData } from "@/types/post"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CreatePostPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  
  // 投稿データの状態管理
  const [title, setTitle] = useState("")
  const [situation, setSituation] = useState<SituationData>({
    gameType: "",
    blinds: "",
    position: "",
    stackSize: "",
    description: "",
  })
  const [visibility, setVisibility] = useState<"public" | "store" | "friends" | "private">("public")
  const [seekingAdvice, setSeekingAdvice] = useState(false)
  const [preflop, setPreflop] = useState<PreflopData | undefined>(undefined)
  const [flop, setFlop] = useState<FlopData | undefined>(undefined)
  const [turn, setTurn] = useState<TurnData | undefined>(undefined)
  const [river, setRiver] = useState<RiverData | undefined>(undefined)
  const [reflection, setReflection] = useState<ReflectionData | undefined>(undefined)

  const totalSteps = 6
  const progress = (currentStep / totalSteps) * 100

  // ステップの定義
  const steps = [
    {
      id: 1,
      title: "状況説明",
      description: "ゲームの基本情報を入力してください",
    },
    {
      id: 2,
      title: "プリフロップ",
      description: "プリフロップでのアクションを記録してください",
    },
    {
      id: 3,
      title: "フロップ",
      description: "フロップでのアクションを記録してください",
    },
    {
      id: 4,
      title: "ターン",
      description: "ターンでのアクションを記録してください",
    },
    {
      id: 5,
      title: "リバー",
      description: "リバーでのアクションを記録してください",
    },
    {
      id: 6,
      title: "感想・まとめ",
      description: "ハンドの結果と感想を記録してください",
    },
  ]

  const currentStepInfo = steps.find((s) => s.id === currentStep)

  // ナビゲーション
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // 投稿保存
  const handleSave = async () => {
    try {
      // バリデーション
      if (!title.trim()) {
        alert("タイトルを入力してください")
        return
      }

      if (!situation.description.trim()) {
        alert("状況説明を入力してください")
        setCurrentStep(1)
        return
      }

      setIsSaving(true)

      // 投稿データの準備
      const postToSave: Partial<PostData> = {
        title: title.trim(),
        situation: situation,
        visibility: visibility,
        seekingAdvice: seekingAdvice,
        authorId: "user1", // TODO: 実際のユーザーIDを取得
        authorName: "りゅうさん", // TODO: 実際のユーザー名を取得
        storeId: "store1", // TODO: 実際の店舗IDを取得
        storeName: "テスト店舗", // TODO: 実際の店舗名を取得
        likes: 0,
        comments: 0,
        views: 0,
      }

      // オプショナルなステップデータを追加
      if (preflop) postToSave.preflop = preflop
      if (flop) postToSave.flop = flop
      if (turn) postToSave.turn = turn
      if (river) postToSave.river = river
      if (reflection) postToSave.reflection = reflection

      console.log("投稿データ:", postToSave)

      // Firestoreに保存
      const postId = await createPost(postToSave)

      console.log("投稿ID:", postId)

      // 成功メッセージ
      alert("投稿を作成しました！")

      // 投稿詳細ページにリダイレクト
      router.push(`/posts/${postId}`)
    } catch (error) {
      console.error("投稿の作成に失敗しました:", error)
      alert("投稿の作成に失敗しました。もう一度お試しください。")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link href="/my-posts">
          <Button variant="ghost" className="flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            投稿一覧に戻る
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">新規投稿作成</CardTitle>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  ステップ {currentStep} / {totalSteps}: {currentStepInfo?.title}
                </span>
                <span className="text-sm font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* タイトル入力（全ステップで表示） */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="title">投稿タイトル *</Label>
            <Input
              id="title"
              placeholder="例: AA vs KK オールイン判断について"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* 公開設定（全ステップで表示） */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <VisibilitySettings
            visibility={visibility}
            seekingAdvice={seekingAdvice}
            onVisibilityChange={setVisibility}
            onSeekingAdviceChange={setSeekingAdvice}
          />
        </CardContent>
      </Card>

      {/* ステップコンテンツ */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{currentStepInfo?.title}</CardTitle>
          <p className="text-muted-foreground">{currentStepInfo?.description}</p>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <PostCreationStep1
              data={situation}
              onUpdate={(data) => setSituation({ ...situation, ...data })}
            />
          )}
          {currentStep === 2 && (
            <PostCreationStep2
              data={preflop || { action: "", betAmount: "", description: "" }}
              onUpdate={(data) => setPreflop({ ...preflop, ...data } as PreflopData)}
            />
          )}
          {currentStep === 3 && (
            <PostCreationStep3
              data={flop || { communityCards: [null, null, null], action: "", betAmount: "", description: "" }}
              onUpdate={(data) => setFlop({ ...flop, ...data } as FlopData)}
            />
          )}
          {currentStep === 4 && (
            <PostCreationStep4
              data={turn || { action: "", betAmount: "", description: "" }}
              onUpdate={(data) => setTurn({ ...turn, ...data } as TurnData)}
            />
          )}
          {currentStep === 5 && (
            <PostCreationStep5
              data={river || { action: "", betAmount: "", description: "" }}
              onUpdate={(data) => setRiver({ ...river, ...data } as RiverData)}
            />
          )}
          {currentStep === 6 && (
            <PostCreationStep6
              data={reflection || { result: "", thoughts: "", seekingAdvice: false, postCategory: "", visibility: "public" }}
              onUpdate={(data) => setReflection({ ...reflection, ...data } as ReflectionData)}
            />
          )}
        </CardContent>
      </Card>

      {/* ナビゲーションボタン */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              前のステップ
            </Button>

            <div className="flex items-center gap-2">
              {currentStep === totalSteps ? (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "保存中..." : "投稿を作成"}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  次のステップ
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 注意事項 */}
      <Alert className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          投稿は後から編集・削除できます。すべてのステップを入力する必要はありませんが、
          タイトルと状況説明は必須です。
        </AlertDescription>
      </Alert>
    </div>
  )
}
