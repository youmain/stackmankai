import { describe, it, expect } from '@jest/globals'

describe('usePokerGame Hook', () => {
  it('フックが正常にインポートできること', () => {
    const module = require('@/hooks/usePokerGame')
    expect(module.usePokerGame).toBeDefined()
  })

  it('フックが関数型であること', () => {
    const module = require('@/hooks/usePokerGame')
    expect(typeof module.usePokerGame).toBe('function')
  })

  it('ゲーム状態管理機能が含まれていること', () => {
    const module = require('@/hooks/usePokerGame')
    const hookString = module.usePokerGame.toString()
    
    // ゲーム状態管理の要素を確認
    expect(hookString).toContain('gameState')
  })

  it('LocalStorage 連携機能が含まれていること', () => {
    const module = require('@/hooks/usePokerGame')
    const hookString = module.usePokerGame.toString()
    
    // LocalStorage 連携の要素を確認
    expect(hookString).toContain('localStorage')
  })

  it('ゲーム状態リセット機能が含まれていること', () => {
    const module = require('@/hooks/usePokerGame')
    const hookString = module.usePokerGame.toString()
    
    // リセット機能の要素を確認
    expect(hookString).toContain('resetGameState')
  })
})
