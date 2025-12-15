import { Card } from "./types"
import { Deck } from "./deck"
import { HandEvaluator } from "./hand-evaluator"

// ゲームの初期化
export function initializeGame(playerCount: number, smallBlind: number, bigBlind: number, startingStack: number) {
  return {
    players: Array.from({ length: playerCount }, (_, i) => ({
      seatIndex: i,
      userId: `player-${i}`,
      userName: `プレイヤー${i + 1}`,
      stack: startingStack,
      currentBet: 0,
      cards: [] as Card[],
      isFolded: false,
      isAllIn: false,
      lastAction: null as string | null,
    })),
    dealerIndex: 0,
    smallBlindIndex: 1 % playerCount,
    bigBlindIndex: 2 % playerCount,
    currentPlayerIndex: (2 % playerCount + 1) % playerCount,
    pot: 0,
    currentBet: bigBlind,
    communityCards: [] as Card[],
    phase: "preflop" as const,
    smallBlind,
    bigBlind,
  }
}

// カードを配る
export function dealCards(game: any) {
  const deck = new Deck()
  deck.shuffle()
  
  // 各プレイヤーに2枚ずつ配る
  for (const player of game.players) {
    if (!player.isFolded) {
      player.cards = deck.dealMultiple(2)
    }
  }
  
  // ブラインドを徴収
  game.players[game.smallBlindIndex].stack -= game.smallBlind
  game.players[game.smallBlindIndex].currentBet = game.smallBlind
  game.players[game.bigBlindIndex].stack -= game.bigBlind
  game.players[game.bigBlindIndex].currentBet = game.bigBlind
  game.pot = game.smallBlind + game.bigBlind
  
  return { game, deck }
}

// フロップを配る
export function dealFlop(deck: Deck, game: any) {
  game.communityCards = deck.dealMultiple(3)
  game.phase = "flop"
  game.currentBet = 0
  // 全プレイヤーのベットをリセット
  for (const player of game.players) {
    player.currentBet = 0
  }
  // ディーラーの次のプレイヤーから開始
  game.currentPlayerIndex = (game.dealerIndex + 1) % game.players.length
}

// ターンを配る
export function dealTurn(deck: Deck, game: any) {
  game.communityCards.push(...deck.dealMultiple(1))
  game.phase = "turn"
  game.currentBet = 0
  for (const player of game.players) {
    player.currentBet = 0
  }
  game.currentPlayerIndex = (game.dealerIndex + 1) % game.players.length
}

// リバーを配る
export function dealRiver(deck: Deck, game: any) {
  game.communityCards.push(...deck.dealMultiple(1))
  game.phase = "river"
  game.currentBet = 0
  for (const player of game.players) {
    player.currentBet = 0
  }
  game.currentPlayerIndex = (game.dealerIndex + 1) % game.players.length
}

// 勝者を決定
export function determineWinners(game: any): { winners: number[]; hands: any[] } {
  const evaluator = new HandEvaluator()
  const activePlayers = game.players.filter((p: any) => !p.isFolded)
  
  if (activePlayers.length === 1) {
    return { winners: [activePlayers[0].seatIndex], hands: [] }
  }
  
  // 各プレイヤーのハンドを評価
  const playerHands = activePlayers.map((player: any) => {
    const allCards = [...player.cards, ...game.communityCards]
    const handRank = evaluator.evaluateHand(allCards)
    return {
      seatIndex: player.seatIndex,
      handRank,
    }
  })
  
  // 最も強いハンドを見つける
  let bestHand = playerHands[0].handRank
  let winners = [playerHands[0].seatIndex]
  
  for (let i = 1; i < playerHands.length; i++) {
    const comparison = evaluator.compareHands(playerHands[i].handRank, bestHand)
    if (comparison > 0) {
      // 新しい最強ハンド
      bestHand = playerHands[i].handRank
      winners = [playerHands[i].seatIndex]
    } else if (comparison === 0) {
      // 引き分け
      winners.push(playerHands[i].seatIndex)
    }
  }
  
  return { winners, hands: playerHands }
}

// ポットを分配
export function distributePot(game: any, winners: number[]) {
  const potShare = Math.floor(game.pot / winners.length)
  
  for (const winnerIndex of winners) {
    game.players[winnerIndex].stack += potShare
  }
  
  game.pot = 0
}

// 次のプレイヤーに移動
export function moveToNextPlayer(game: any) {
  let nextIndex = (game.currentPlayerIndex + 1) % game.players.length
  
  // フォールドしていないプレイヤーを探す
  while (game.players[nextIndex].isFolded || game.players[nextIndex].isAllIn) {
    nextIndex = (nextIndex + 1) % game.players.length
    
    // 全員チェック済みの場合
    if (nextIndex === game.currentPlayerIndex) {
      return false
    }
  }
  
  game.currentPlayerIndex = nextIndex
  return true
}
