"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { VisibilitySettings } from "./visibility-settings"
import type { ReflectionData } from "@/types/post"

interface Props {
  data: ReflectionData
  onUpdate: (data: Partial<ReflectionData>) => void
}

export function PostCreationStep6({ data, onUpdate }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-foreground mb-2">感想・アドバイス</h3>
        <p className="text-muted-foreground">ハンドの結果と感想を記入してください</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="postCategory">投稿カテゴリ</Label>
          <Select value={data.postCategory} onValueChange={(value) => onUpdate({ postCategory: value })}>
            <SelectTrigger>
              <SelectValue placeholder="投稿の目的を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="advice">アドバイス求む</SelectItem>
              <SelectItem value="good-hand">気持ちよかったハンド</SelectItem>
              <SelectItem value="bad-beat">悲しかったハンド</SelectItem>
              <SelectItem value="learning">学びになったハンド</SelectItem>
              <SelectItem value="difficult">判断に迷ったハンド</SelectItem>
              <SelectItem value="bluff-success">ブラフ成功</SelectItem>
              <SelectItem value="unlucky">運が悪かったハンド</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="result">ハンドの結果</Label>
          <Select value={data.result} onValueChange={(value) => onUpdate({ result: value })}>
            <SelectTrigger>
              <SelectValue placeholder="結果を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="win">勝利</SelectItem>
              <SelectItem value="lose">敗北</SelectItem>
              <SelectItem value="fold">フォールド</SelectItem>
              <SelectItem value="split">スプリット</SelectItem>
              <SelectItem value="showdown-win">ショーダウン勝利</SelectItem>
              <SelectItem value="bluff-win">ブラフ勝利</SelectItem>
              <SelectItem value="bad-beat">バッドビート</SelectItem>
              <SelectItem value="cooler">クーラー</SelectItem>
              <SelectItem value="timeout">タイムアウト</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="thoughts">感想・振り返り</Label>
          <Textarea
            id="thoughts"
            placeholder="このハンドについての感想、反省点、学んだことなどを記入してください"
            value={data.thoughts}
            onChange={(e) => onUpdate({ thoughts: e.target.value })}
            rows={4}
          />
        </div>

        {data.postCategory === "advice" && (
          <div className="flex items-center space-x-2">
            <Switch
              id="seekingAdvice"
              checked={data.seekingAdvice}
              onCheckedChange={(checked) => onUpdate({ seekingAdvice: checked })}
            />
            <Label htmlFor="seekingAdvice">他のプレイヤーからのアドバイスを求める</Label>
          </div>
        )}

        <VisibilitySettings
          value={data.visibility as "public" | "store" | "friends" | "private"}
          onChange={(value) => onUpdate({ visibility: value })}
          storeName="東京ポーカークラブ"
        />
      </div>
    </div>
  )
}
