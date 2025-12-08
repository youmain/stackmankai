"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import type { FlopData, PlayerAction } from "@/types/post"
import { CardSelector } from "@/components/card-selector"

interface Props {
  data: FlopData
  onUpdate: (data: Partial<FlopData>) => void
}

export function PostCreationStep3({ data, onUpdate }: Props) {
  const addPlayerAction = () => {
    const newAction: PlayerAction = {
      playerId: `player-${Date.now()}`,
      playerName: "",
      position: "",
      action: "fold",
      amount: "",
      description: "",
    }
    onUpdate({
      playerActions: [...(data.playerActions || []), newAction],
    })
  }

  const updatePlayerAction = (index: number, updates: Partial<PlayerAction>) => {
    const updatedActions = [...(data.playerActions || [])]
    updatedActions[index] = { ...updatedActions[index], ...updates }
    onUpdate({ playerActions: updatedActions })
  }

  const removePlayerAction = (index: number) => {
    const updatedActions = [...(data.playerActions || [])]
    updatedActions.splice(index, 1)
    onUpdate({ playerActions: updatedActions })
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-foreground mb-2">フロップ</h3>
        <p className="text-muted-foreground">フロップカードとアクションを入力してください</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>コミュニティカード（フロップ）</Label>
          <div className="flex gap-4">
            <CardSelector
              value={data.communityCards[0]}
              onChange={(card) => onUpdate({ communityCards: [card, data.communityCards[1], data.communityCards[2]] })}
              placeholder="1枚目"
            />
            <CardSelector
              value={data.communityCards[1]}
              onChange={(card) => onUpdate({ communityCards: [data.communityCards[0], card, data.communityCards[2]] })}
              placeholder="2枚目"
            />
            <CardSelector
              value={data.communityCards[2]}
              onChange={(card) => onUpdate({ communityCards: [data.communityCards[0], data.communityCards[1], card] })}
              placeholder="3枚目"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="action">自分のアクション</Label>
            <Select value={data.action} onValueChange={(value) => onUpdate({ action: value })}>
              <SelectTrigger>
                <SelectValue placeholder="アクションを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fold">フォールド</SelectItem>
                <SelectItem value="call">コール</SelectItem>
                <SelectItem value="raise">レイズ</SelectItem>
                <SelectItem value="check">チェック</SelectItem>
                <SelectItem value="bet">ベット</SelectItem>
                <SelectItem value="allin">オールイン</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="betAmount">ベット額</Label>
            <Input
              id="betAmount"
              placeholder="例: 2,000"
              value={data.betAmount}
              onChange={(e) => onUpdate({ betAmount: e.target.value })}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">他のプレイヤーのアクション（オプション）</CardTitle>
              <Button onClick={addPlayerAction} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                アクション追加
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.playerActions?.map((playerAction, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">プレイヤー {index + 1}</h4>
                  <Button onClick={() => removePlayerAction(index)} size="sm" variant="ghost">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>プレイヤー名</Label>
                    <Input
                      placeholder="例: Player1"
                      value={playerAction.playerName}
                      onChange={(e) => updatePlayerAction(index, { playerName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>ポジション</Label>
                    <Select
                      value={playerAction.position}
                      onValueChange={(value) => updatePlayerAction(index, { position: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="ポジション" />
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
                    <Label>アクション</Label>
                    <Select
                      value={playerAction.action}
                      onValueChange={(value: any) => updatePlayerAction(index, { action: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="アクション" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fold">フォールド</SelectItem>
                        <SelectItem value="call">コール</SelectItem>
                        <SelectItem value="raise">レイズ</SelectItem>
                        <SelectItem value="check">チェック</SelectItem>
                        <SelectItem value="bet">ベット</SelectItem>
                        <SelectItem value="all-in">オールイン</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ベット額</Label>
                    <Input
                      placeholder="例: 500"
                      value={playerAction.amount}
                      onChange={(e) => updatePlayerAction(index, { amount: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>メモ</Label>
                    <Input
                      placeholder="アクションの詳細など"
                      value={playerAction.description}
                      onChange={(e) => updatePlayerAction(index, { description: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}

            {(!data.playerActions || data.playerActions.length === 0) && (
              <p className="text-muted-foreground text-center py-4">
                他のプレイヤーのアクションを記録したい場合は「アクション追加」ボタンを押してください
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Label htmlFor="description">フロップの詳細</Label>
          <Textarea
            id="description"
            placeholder="フロップでの思考過程、ボードテクスチャの分析など"
            value={data.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}
