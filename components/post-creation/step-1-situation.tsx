"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SituationData } from "@/types/post"

interface Props {
  data: SituationData
  onUpdate: (data: Partial<SituationData>) => void
}

export function PostCreationStep1({ data, onUpdate }: Props) {
  const parseBlindValues = (blindsString: string) => {
    if (!blindsString) return { sb: "", bb: "" }
    const parts = blindsString.split("/")
    return {
      sb: parts[0]?.trim() || "",
      bb: parts[1]?.trim() || "",
    }
  }

  const { sb, bb } = parseBlindValues(data.blinds)

  const updateBlindValues = (newSb: string, newBb: string) => {
    // 両方が空の場合は空文字列
    if (!newSb && !newBb) {
      onUpdate({ blinds: "" })
      return
    }

    // どちらか一方でも値があれば、スラッシュ形式で保存
    const blindsValue = `${newSb}/${newBb}`
    onUpdate({ blinds: blindsValue })

    console.log("[v0] ブラインド更新:", { newSb, newBb, blindsValue })
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-foreground mb-2">状況説明</h3>
        <p className="text-muted-foreground">ゲームの基本情報を入力してください</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="gameType">ゲームタイプ</Label>
          <Select value={data.gameType} onValueChange={(value) => onUpdate({ gameType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="ゲームタイプを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">キャッシュゲーム</SelectItem>
              <SelectItem value="tournament">トーナメント</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>ブラインド</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="sb" className="text-xs text-muted-foreground">
                スモールブラインド (SB)
              </Label>
              <Input
                id="sb"
                placeholder="例: 100"
                value={sb}
                onChange={(e) => {
                  console.log("[v0] SB入力:", e.target.value)
                  updateBlindValues(e.target.value, bb)
                }}
              />
            </div>
            <div>
              <Label htmlFor="bb" className="text-xs text-muted-foreground">
                ビッグブラインド (BB)
              </Label>
              <Input
                id="bb"
                placeholder="例: 200"
                value={bb}
                onChange={(e) => {
                  console.log("[v0] BB入力:", e.target.value)
                  updateBlindValues(sb, e.target.value)
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">ポジション</Label>
          <Select value={data.position} onValueChange={(value) => onUpdate({ position: value })}>
            <SelectTrigger>
              <SelectValue placeholder="ポジションを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="utg">UTG</SelectItem>
              <SelectItem value="mp">MP</SelectItem>
              <SelectItem value="co">CO</SelectItem>
              <SelectItem value="btn">BTN</SelectItem>
              <SelectItem value="sb">SB</SelectItem>
              <SelectItem value="bb">BB</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stackSize">スタックサイズ</Label>
          <Input
            id="stackSize"
            placeholder="例: 20,000"
            value={data.stackSize}
            onChange={(e) => onUpdate({ stackSize: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">状況の詳細</Label>
        <Textarea
          id="description"
          placeholder="テーブルの状況、相手プレイヤーの特徴など詳細を記入してください"
          value={data.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={4}
        />
      </div>
    </div>
  )
}
