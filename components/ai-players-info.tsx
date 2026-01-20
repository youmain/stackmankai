"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AI_PLAYERS, AI_PLAYERS_DESCRIPTION } from "@/lib/ai-players"
import { Bot, Star, Target, Sparkles } from "lucide-react"

export function AIPlayersInfo() {
  return (
    <div className="space-y-6">
      <Alert className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <AlertDescription className="text-purple-900">
          <div className="space-y-2">
            <p className="font-bold text-lg">🎉 投稿の楽しみが増えます！ 🎉</p>
            <p className="text-sm">
              あなたがハンド記録を投稿すると、これらのAIポーカープレイヤーがランダムでコメントする可能性があります！
            </p>
            <p className="text-sm">
              それぞれ異なるプレイスタイルと性格を持つAIが、あなたのプレイに対して独自の視点からアドバイスやコメントを提供します。
            </p>
            <p className="text-sm font-semibold text-purple-700">どのAIがコメントしてくれるか、お楽しみに！</p>
          </div>
        </AlertDescription>
      </Alert>

      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800 text-lg sm:text-xl">
            <Bot className="h-5 w-5" />🤖 AIポーカープレイヤー紹介 🤖
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-700 whitespace-pre-line">{AI_PLAYERS_DESCRIPTION}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(AI_PLAYERS || []).map((player) => (
              <div key={player.id} className="bg-white p-4 rounded-lg border border-purple-100 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-purple-900">{player.name}</h3>
                    <p className="text-sm text-gray-600">
                      {player.age}歳 / 経験{player.experience}年
                    </p>
                  </div>
                  <Bot className="h-6 w-6 text-purple-500" />
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">得意形式</p>
                  <p className="text-sm text-gray-700">{player.specialty}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">プレイスタイル</p>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {player.playStyle}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">特徴</p>
                  <ul className="space-y-1">
                    {(player.characteristics || []).slice(0, 3).map((char, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start">
                        <span className="mr-1">•</span>
                        <span>{char}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Star className="h-3 w-3 text-green-500" />
                      得意
                    </p>
                    <p className="text-xs text-green-700">{(player.strengths || [])[0] || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Target className="h-3 w-3 text-orange-500" />
                      苦手
                    </p>
                    <p className="text-xs text-orange-700">{(player.weaknesses || [])[0] || "N/A"}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-purple-600 italic">「{(player.famousQuotes || [])[0] || "名言なし"}」</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
