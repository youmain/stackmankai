"use client"

import { useState, useEffect } from "react"
import { HandVisualizer, type HandData } from "@/components/poker-table/hand-visualizer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { PostData } from "@/types/post"

interface PostPreviewProps {
  postData: PostData
  className?: string
  initialStep?: number
}

interface StepInfo {
  id: string
  title: string
  description: string
}

const steps: StepInfo[] = [
  { id: "overview", title: "状況の説明", description: "テーブル情報・基本状況" },
  { id: "preflop", title: "プリフロップ", description: "配られたハンドと初期アクション" },
  { id: "flop", title: "フロップ", description: "最初の3枚のコミュニティカード" },
  { id: "turn", title: "ターン", description: "4枚目のコミュニティカード" },
  { id: "river", title: "リバー", description: "最後のコミュニティカード" },
  { id: "reflection", title: "感想・まとめ", description: "結果と振り返り" },
]

const postCategoryLabels: Record<string, string> = {
  advice: "アドバイス求む",
  "good-hand": "気持ちよかったハンド",
  "bad-beat": "悲しかったハンド",
  learning: "学びになったハンド",
  difficult: "判断に迷ったハンド",
  "bluff-success": "ブラフ成功",
  unlucky: "運が悪かったハンド",
}

const resultLabels: Record<string, string> = {
  win: "勝利",
  lose: "敗北",
  fold: "フォールド",
  split: "スプリット",
  "showdown-win": "ショーダウン勝利",
  "bluff-win": "ブラフ勝利",
  "bad-beat": "バッドビート",
  cooler: "クーラー",
  timeout: "タイムアウト",
}

export function PostPreview({ postData, className, initialStep = 0 }: PostPreviewProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)

  useEffect(() => {
    setCurrentStep(initialStep)
  }, [initialStep])

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  const renderStepContent = () => {
    const step = steps[currentStep]

    switch (step.id) {
      case "overview":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  1
                </span>
                状況の説明
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">基本情報</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">ゲーム形式:</span>
                    <span className="ml-2">
                      {postData.situation && typeof postData.situation === "object" && "gameType" in postData.situation
                        ? postData.situation.gameType || "未設定"
                        : "未設定"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ポジション:</span>
                    <span className="ml-2">
                      {postData.situation && typeof postData.situation === "object" && "position" in postData.situation
                        ? postData.situation.position || "未設定"
                        : "未設定"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ブラインド:</span>
                    <span className="ml-2">
                      {postData.situation && typeof postData.situation === "object" && "blinds" in postData.situation
                        ? postData.situation.blinds || "未設定"
                        : "未設定"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">スタック:</span>
                    <span className="ml-2">
                      {postData.situation && typeof postData.situation === "object" && "stackSize" in postData.situation
                        ? postData.situation.stackSize || "未設定"
                        : "未設定"}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">状況説明</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {typeof postData.situation === "object" &&
                  postData.situation !== null &&
                  "description" in postData.situation
                    ? postData.situation.description || "状況の説明が入力されていません"
                    : typeof postData.situation === "string"
                      ? postData.situation || "状況の説明が入力されていません"
                      : "状況の説明が入力されていません"}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {postData.reflection?.postCategory && (
                  <Badge variant="default" className="text-blue-600 border-blue-600">
                    {postCategoryLabels[postData.reflection.postCategory] || postData.reflection.postCategory}
                  </Badge>
                )}
                {postData.seekingAdvice && (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    アドバイス求む
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case "preflop":
      case "flop":
      case "turn":
      case "river":
        const stageData = postData[step.id as keyof Pick<PostData, "preflop" | "flop" | "turn" | "river">]
        if (!stageData) {
          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-gray-400 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {currentStep + 1}
                  </span>
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">この段階の情報は記録されていません</p>
              </CardContent>
            </Card>
          )
        }

        const handData: HandData = {
          situation: stageData.situation || "",
          players: stageData.players || [],
          communityCards: stageData.communityCards || [],
          pot: stageData.pot || 0,
          currentBet: stageData.currentBet || 0,
          stage: step.id as "preflop" | "flop" | "turn" | "river",
          heroPosition: stageData.heroPosition || 0,
          action: stageData.action || "",
          result: stageData.result,
        }

        console.log("[v0] PostPreview - handData:", {
          stage: step.id,
          playersCount: handData.players.length,
          players: handData.players,
          communityCards: handData.communityCards,
          pot: handData.pot,
          heroPosition: handData.heroPosition,
        })

        return (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                {currentStep + 1}
              </span>
              <h3 className="text-xl font-semibold">{step.title}</h3>
            </div>
            <HandVisualizer handData={handData} showAllCards={step.id === "river"} showHeroCards={true} />
          </div>
        )

      case "reflection":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  6
                </span>
                感想・まとめ
              </CardTitle>
            </CardHeader>
            <CardContent>
              {postData.reflection ? (
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap mb-4">
                    {postData.reflection.result && (
                      <Badge variant="secondary">
                        結果: {resultLabels[postData.reflection.result] || postData.reflection.result}
                      </Badge>
                    )}
                    {postData.reflection.postCategory && (
                      <Badge variant="default">
                        {postCategoryLabels[postData.reflection.postCategory] || postData.reflection.postCategory}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">振り返り</h4>
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {postData.reflection.thoughts || "感想が記録されていません"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">感想やまとめが記録されていません</p>
              )}
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {currentStep + 1}/6 - {steps[currentStep].title}
          </h2>
          <div className="text-sm text-muted-foreground">{steps[currentStep].description}</div>
        </div>

        {/* ステップナビゲーション */}
        <div className="flex items-center gap-2 mb-4">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              className={`flex-1 h-2 rounded-full transition-colors ${
                index === currentStep ? "bg-blue-500" : index < currentStep ? "bg-green-500" : "bg-gray-200"
              }`}
              title={`${index + 1}. ${step.title}`}
            />
          ))}
        </div>

        {/* ステップボタン */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {steps.map((step, index) => (
            <Button
              key={step.id}
              variant={index === currentStep ? "default" : "outline"}
              size="sm"
              onClick={() => goToStep(index)}
              className="min-w-[40px]"
            >
              {index + 1}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-6">{renderStepContent()}</div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goToPrevStep}
          disabled={currentStep === 0}
          className="flex items-center gap-2 bg-transparent"
        >
          <ChevronLeft className="w-4 h-4" />
          前のステップ
        </Button>

        <div className="text-sm text-muted-foreground">
          {currentStep + 1} / {steps.length}
        </div>

        <Button
          variant="outline"
          onClick={goToNextStep}
          disabled={currentStep === steps.length - 1}
          className="flex items-center gap-2 bg-transparent"
        >
          次のステップ
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
