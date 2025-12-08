"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  Minus,
  Trash2,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
} from "lucide-react"

interface Transaction {
  id: string
  type: "buy-in" | "rebuy" | "cash-out"
  amount: number
  timestamp: Date
}

interface Player {
  id: string
  name: string
  stack: number
  totalBuyIn: number
  totalCashOut: number
  transactions: Transaction[]
}

export default function StackManagerPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [newPlayerName, setNewPlayerName] = useState("")
  const [newPlayerStack, setNewPlayerStack] = useState("")
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [transactionAmount, setTransactionAmount] = useState("")
  const [transactionType, setTransactionType] = useState<"buy-in" | "rebuy" | "cash-out">("buy-in")

  const addPlayer = () => {
    if (newPlayerName.trim() && newPlayerStack) {
      const amount = Number.parseFloat(newPlayerStack)
      const player: Player = {
        id: Date.now().toString(),
        name: newPlayerName.trim(),
        stack: amount,
        totalBuyIn: amount,
        totalCashOut: 0,
        transactions: [
          {
            id: Date.now().toString(),
            type: "buy-in",
            amount: amount,
            timestamp: new Date(),
          },
        ],
      }
      setPlayers([...players, player])
      setNewPlayerName("")
      setNewPlayerStack("")
    }
  }

  const addTransaction = () => {
    if (!selectedPlayer || !transactionAmount) return

    const amount = Number.parseFloat(transactionAmount)
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: transactionType,
      amount: amount,
      timestamp: new Date(),
    }

    setPlayers(
      players.map((player) => {
        if (player.id === selectedPlayer.id) {
          let newStack = player.stack
          let newTotalBuyIn = player.totalBuyIn
          let newTotalCashOut = player.totalCashOut

          if (transactionType === "buy-in" || transactionType === "rebuy") {
            newStack += amount
            newTotalBuyIn += amount
          } else if (transactionType === "cash-out") {
            newStack -= amount
            newTotalCashOut += amount
          }

          return {
            ...player,
            stack: Math.max(0, newStack),
            totalBuyIn: newTotalBuyIn,
            totalCashOut: newTotalCashOut,
            transactions: [...player.transactions, transaction],
          }
        }
        return player
      }),
    )

    setTransactionAmount("")
    setSelectedPlayer(null)
  }

  const removePlayer = (id: string) => {
    setPlayers(players.filter((player) => player.id !== id))
  }

  const totalStack = players.reduce((sum, player) => sum + player.stack, 0)
  const totalBuyIn = players.reduce((sum, player) => sum + player.totalBuyIn, 0)
  const totalCashOut = players.reduce((sum, player) => sum + player.totalCashOut, 0)

  const getPlayerProfit = (player: Player) => {
    return player.totalCashOut + player.stack - player.totalBuyIn
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-primary to-secondary p-4 rounded-2xl shadow-2xl">
              <Users className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-foreground mb-3 text-balance bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ポーカースタック管理
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground font-medium">
            プレイヤーのスタック額と損益をリアルタイムで管理
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-br from-white to-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Wallet className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">現在のスタック</p>
                  <p className="text-3xl font-black text-primary">¥{totalStack.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-accent/20 shadow-xl bg-gradient-to-br from-white to-accent/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-accent/10 p-3 rounded-xl">
                  <ArrowDownCircle className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">総バイイン</p>
                  <p className="text-3xl font-black text-accent">¥{totalBuyIn.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-chart-1/20 shadow-xl bg-gradient-to-br from-white to-chart-1/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-chart-1/10 p-3 rounded-xl">
                  <ArrowUpCircle className="w-8 h-8 text-chart-1" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">総キャッシュアウト</p>
                  <p className="text-3xl font-black text-chart-1">¥{totalCashOut.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add Player Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b-2 border-border">
                <CardTitle className="text-2xl font-black text-foreground">プレイヤー追加</CardTitle>
                <CardDescription className="font-medium">新しいプレイヤーを登録</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="playerName" className="font-bold text-base">
                    プレイヤー名
                  </Label>
                  <Input
                    id="playerName"
                    placeholder="名前を入力"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        document.getElementById("playerStack")?.focus()
                      }
                    }}
                    className="border-2 focus:border-primary h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="playerStack" className="font-bold text-base">
                    初期バイイン額
                  </Label>
                  <Input
                    id="playerStack"
                    type="number"
                    placeholder="金額を入力"
                    value={newPlayerStack}
                    onChange={(e) => setNewPlayerStack(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addPlayer()
                      }
                    }}
                    className="border-2 focus:border-primary h-12 text-base"
                  />
                </div>
                <Button
                  onClick={addPlayer}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-bold text-lg py-6 shadow-lg hover:shadow-xl transition-all"
                  disabled={!newPlayerName.trim() || !newPlayerStack}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  プレイヤーを追加
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Players List */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {players.length === 0 ? (
                <Card className="border-2 border-dashed border-border shadow-lg">
                  <CardContent className="py-20 text-center">
                    <Users className="w-20 h-20 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <p className="text-xl text-muted-foreground font-bold">プレイヤーがまだ登録されていません</p>
                    <p className="text-base text-muted-foreground mt-2">
                      左のフォームから新しいプレイヤーを追加してください
                    </p>
                  </CardContent>
                </Card>
              ) : (
                players.map((player) => {
                  const profit = getPlayerProfit(player)
                  const isProfit = profit >= 0

                  return (
                    <Card
                      key={player.id}
                      className="border-2 hover:border-primary/50 transition-all shadow-lg hover:shadow-2xl bg-gradient-to-br from-white to-slate-50"
                    >
                      <CardContent className="p-6">
                        <Tabs defaultValue="overview" className="w-full">
                          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                            <div>
                              <h3 className="text-2xl lg:text-3xl font-black text-card-foreground mb-1">
                                {player.name}
                              </h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={isProfit ? "default" : "destructive"} className="text-sm font-bold">
                                  {isProfit ? (
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 mr-1" />
                                  )}
                                  {isProfit ? "+" : ""}¥{profit.toLocaleString()}
                                </Badge>
                              </div>
                            </div>
                            <TabsList className="bg-muted">
                              <TabsTrigger value="overview" className="font-bold">
                                概要
                              </TabsTrigger>
                              <TabsTrigger value="history" className="font-bold">
                                履歴
                              </TabsTrigger>
                            </TabsList>
                          </div>

                          <TabsContent value="overview" className="space-y-4 mt-0">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-primary/5 p-4 rounded-xl border-2 border-primary/20">
                                <p className="text-xs text-muted-foreground font-semibold mb-1">現在のスタック</p>
                                <p className="text-2xl font-black text-primary">¥{player.stack.toLocaleString()}</p>
                              </div>
                              <div className="bg-accent/5 p-4 rounded-xl border-2 border-accent/20">
                                <p className="text-xs text-muted-foreground font-semibold mb-1">総バイイン</p>
                                <p className="text-2xl font-black text-accent">¥{player.totalBuyIn.toLocaleString()}</p>
                              </div>
                              <div className="bg-chart-1/5 p-4 rounded-xl border-2 border-chart-1/20">
                                <p className="text-xs text-muted-foreground font-semibold mb-1">総キャッシュアウト</p>
                                <p className="text-2xl font-black text-chart-1">
                                  ¥{player.totalCashOut.toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap pt-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    onClick={() => {
                                      setSelectedPlayer(player)
                                      setTransactionType("buy-in")
                                    }}
                                    variant="outline"
                                    size="lg"
                                    className="border-2 hover:bg-accent hover:text-accent-foreground hover:border-accent font-bold"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    バイイン
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle className="text-2xl font-black">取引を記録</DialogTitle>
                                    <DialogDescription className="font-medium">
                                      {player.name}の取引を記録します
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label className="font-bold">取引タイプ</Label>
                                      <div className="flex gap-2">
                                        <Button
                                          type="button"
                                          variant={transactionType === "buy-in" ? "default" : "outline"}
                                          onClick={() => setTransactionType("buy-in")}
                                          className="flex-1 font-bold"
                                        >
                                          バイイン
                                        </Button>
                                        <Button
                                          type="button"
                                          variant={transactionType === "rebuy" ? "default" : "outline"}
                                          onClick={() => setTransactionType("rebuy")}
                                          className="flex-1 font-bold"
                                        >
                                          リバイ
                                        </Button>
                                        <Button
                                          type="button"
                                          variant={transactionType === "cash-out" ? "default" : "outline"}
                                          onClick={() => setTransactionType("cash-out")}
                                          className="flex-1 font-bold"
                                        >
                                          キャッシュアウト
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="amount" className="font-bold">
                                        金額
                                      </Label>
                                      <Input
                                        id="amount"
                                        type="number"
                                        placeholder="金額を入力"
                                        value={transactionAmount}
                                        onChange={(e) => setTransactionAmount(e.target.value)}
                                        className="border-2 h-12"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      onClick={addTransaction}
                                      disabled={!transactionAmount}
                                      className="w-full font-bold text-lg py-6"
                                    >
                                      記録する
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    onClick={() => {
                                      setSelectedPlayer(player)
                                      setTransactionType("rebuy")
                                    }}
                                    variant="outline"
                                    size="lg"
                                    className="border-2 hover:bg-accent hover:text-accent-foreground hover:border-accent font-bold"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    リバイ
                                  </Button>
                                </DialogTrigger>
                              </Dialog>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    onClick={() => {
                                      setSelectedPlayer(player)
                                      setTransactionType("cash-out")
                                    }}
                                    variant="outline"
                                    size="lg"
                                    className="border-2 hover:bg-chart-1 hover:text-white hover:border-chart-1 font-bold"
                                  >
                                    <Minus className="w-4 h-4 mr-1" />
                                    キャッシュアウト
                                  </Button>
                                </DialogTrigger>
                              </Dialog>

                              <Button
                                onClick={() => removePlayer(player.id)}
                                variant="outline"
                                size="lg"
                                className="border-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive font-bold ml-auto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TabsContent>

                          <TabsContent value="history" className="mt-0">
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {player.transactions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">取引履歴がありません</p>
                              ) : (
                                player.transactions
                                  .slice()
                                  .reverse()
                                  .map((transaction) => (
                                    <div
                                      key={transaction.id}
                                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                                    >
                                      <div className="flex items-center gap-3">
                                        <Badge
                                          variant={transaction.type === "cash-out" ? "default" : "secondary"}
                                          className="font-bold"
                                        >
                                          {transaction.type === "buy-in"
                                            ? "バイイン"
                                            : transaction.type === "rebuy"
                                              ? "リバイ"
                                              : "キャッシュアウト"}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground font-medium">
                                          {transaction.timestamp.toLocaleString("ja-JP", {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      </div>
                                      <span className="text-lg font-black">
                                        {transaction.type === "cash-out" ? "-" : "+"}¥
                                        {transaction.amount.toLocaleString()}
                                      </span>
                                    </div>
                                  ))
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
