"use client"

import { Button } from "@/components/ui/button"
import { Deck } from "@/lib/poker-logic/deck"
import { HandEvaluator } from "@/lib/poker-logic/hand-evaluator"
import { initializeGame, dealCards, dealFlop, dealTurn, dealRiver, determineWinners } from "@/lib/poker-logic/game-helpers"
import { useState } from "react"
import { cardToString } from "@/lib/poker-logic/card"

export function PokerTestControls() {
  const [testResult, setTestResult] = useState<string>("")
  const [game, setGame] = useState<any>(null)
  const [deck, setDeck] = useState<Deck | null>(null)

  const handleTestDeck = () => {
    const newDeck = new Deck()
    newDeck.shuffle()
    const cards = newDeck.dealMultiple(7)
    const cardStrings = cards.map(cardToString).join(", ")
    setTestResult(`デッキテスト成功！配られたカード: ${cardStrings}`)
  }

  const handleTestHandEvaluator = () => {
    const deck = new Deck()
    deck.shuffle()
    const cards = deck.dealMultiple(7)
    
    const evaluator = new HandEvaluator()
    const handRank = evaluator.evaluateHand(cards)
    
    const rankNames = [
      "ハイカード",
      "ワンペア",
      "ツーペア",
      "スリーカード",
      "ストレート",
      "フラッシュ",
      "フルハウス",
      "フォーカード",
      "ストレートフラッシュ",
      "ロイヤルフラッシュ",
    ]
    
    const cardStrings = cards.map(cardToString).join(", ")
    const handCards = handRank.cards.map(cardToString).join(", ")
    
    setTestResult(
      `ハンド評価テスト成功！\n` +
      `配られたカード: ${cardStrings}\n` +
      `役: ${rankNames[handRank.type]}\n` +
      `使用カード: ${handCards}`
    )
  }

  const handleInitGame = () => {
    const newGame = initializeGame(4, 10, 20, 1000)
    const result = dealCards(newGame)
    setGame(result.game)
    setDeck(result.deck)
    
    const playerCards = result.game.players
      .map((p: any, i: number) => 
        `プレイヤー${i + 1}: ${p.cards.map(cardToString).join(", ")}`
      )
      .join("\n")
    
    setTestResult(
      `ゲーム初期化成功！\n` +
      `ポット: ¥${result.game.pot}\n` +
      `現在のベット: ¥${result.game.currentBet}\n` +
      `${playerCards}`
    )
  }

  const handleDealFlop = () => {
    if (!game || !deck) {
      setTestResult("先にゲームを初期化してください")
      return
    }
    
    dealFlop(deck, game)
    setGame({ ...game })
    
    const communityCards = game.communityCards.map(cardToString).join(", ")
    setTestResult(`フロップ: ${communityCards}`)
  }

  const handleDealTurn = () => {
    if (!game || !deck) {
      setTestResult("先にゲームを初期化してください")
      return
    }
    
    dealTurn(deck, game)
    setGame({ ...game })
    
    const communityCards = game.communityCards.map(cardToString).join(", ")
    setTestResult(`ターン: ${communityCards}`)
  }

  const handleDealRiver = () => {
    if (!game || !deck) {
      setTestResult("先にゲームを初期化してください")
      return
    }
    
    dealRiver(deck, game)
    setGame({ ...game })
    
    const communityCards = game.communityCards.map(cardToString).join(", ")
    setTestResult(`リバー: ${communityCards}`)
  }

  const handleShowdown = () => {
    if (!game) {
      setTestResult("先にゲームを初期化してください")
      return
    }
    
    const { winners, hands } = determineWinners(game)
    
    const rankNames = [
      "ハイカード",
      "ワンペア",
      "ツーペア",
      "スリーカード",
      "ストレート",
      "フラッシュ",
      "フルハウス",
      "フォーカード",
      "ストレートフラッシュ",
      "ロイヤルフラッシュ",
    ]
    
    const handsInfo = hands
      .map((h: any) => 
        `プレイヤー${h.seatIndex + 1}: ${rankNames[h.handRank.type]} (${h.handRank.cards.map(cardToString).join(", ")})`
      )
      .join("\n")
    
    const winnersInfo = winners.map((w: number) => `プレイヤー${w + 1}`).join(", ")
    
    setTestResult(
      `ショーダウン結果:\n\n` +
      `${handsInfo}\n\n` +
      `勝者: ${winnersInfo}`
    )
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg space-y-4">
      <h3 className="font-bold text-lg">ポーカーロジックテスト</h3>
      
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleTestDeck} variant="outline" size="sm">
          デッキテスト
        </Button>
        <Button onClick={handleTestHandEvaluator} variant="outline" size="sm">
          ハンド評価テスト
        </Button>
        <Button onClick={handleInitGame} variant="outline" size="sm">
          ゲーム初期化
        </Button>
        <Button onClick={handleDealFlop} variant="outline" size="sm" disabled={!game}>
          フロップ
        </Button>
        <Button onClick={handleDealTurn} variant="outline" size="sm" disabled={!game}>
          ターン
        </Button>
        <Button onClick={handleDealRiver} variant="outline" size="sm" disabled={!game}>
          リバー
        </Button>
        <Button onClick={handleShowdown} variant="outline" size="sm" disabled={!game}>
          ショーダウン
        </Button>
      </div>
      
      {testResult && (
        <pre className="p-4 bg-white rounded border text-sm whitespace-pre-wrap">
          {testResult}
        </pre>
      )}
    </div>
  )
}
