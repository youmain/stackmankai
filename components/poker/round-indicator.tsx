"use client"

import { useEffect, useState } from "react"

interface RoundIndicatorProps {
  phase: string
  pot: number
}

const PHASE_INFO = {
  waiting: { label: "待機中", color: "bg-gray-500", icon: "⏸️" },
  preflop: { label: "PREFLOP", color: "bg-blue-500", icon: "🎴" },
  flop: { label: "FLOP", color: "bg-green-500", icon: "🃏" },
  turn: { label: "TURN", color: "bg-yellow-500", icon: "🎯" },
  river: { label: "RIVER", color: "bg-red-500", icon: "🌊" },
  showdown: { label: "SHOWDOWN", color: "bg-purple-500", icon: "👁️" }
}

export function RoundIndicator({ phase, pot }: RoundIndicatorProps) {
  const [animate, setAnimate] = useState(false)
  const [prevPhase, setPrevPhase] = useState(phase)

  useEffect(() => {
    if (phase !== prevPhase) {
      setAnimate(true)
      setPrevPhase(phase)
      const timer = setTimeout(() => setAnimate(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [phase, prevPhase])

  const phaseInfo = PHASE_INFO[phase as keyof typeof PHASE_INFO] || PHASE_INFO.waiting

  return (
    <div className="flex items-center justify-center gap-4 mb-4">
      {/* フェーズインジケーター */}
      <div 
        className={`${phaseInfo.color} text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 transition-all duration-300 ${
          animate ? 'scale-110 animate-pulse' : 'scale-100'
        }`}
      >
        <span className="text-2xl">{phaseInfo.icon}</span>
        <span className="text-xl font-bold">{phaseInfo.label}</span>
      </div>

      {/* POT表示 */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-6 py-3 rounded-full shadow-lg">
        <div className="text-xs font-semibold opacity-90">POT</div>
        <div className="text-2xl font-bold">{pot.toLocaleString()}</div>
      </div>
    </div>
  )
}

// フェーズ進行バー
export function PhaseProgressBar({ phase }: { phase: string }) {
  const phases = ['preflop', 'flop', 'turn', 'river', 'showdown']
  const currentIndex = phases.indexOf(phase)

  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {phases.map((p, index) => {
        const phaseInfo = PHASE_INFO[p as keyof typeof PHASE_INFO]
        const isActive = index === currentIndex
        const isPassed = index < currentIndex
        
        return (
          <div key={p} className="flex items-center">
            <div 
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive ? `${phaseInfo.color} scale-110 shadow-lg` :
                isPassed ? 'bg-gray-400' : 'bg-gray-200'
              }`}
            >
              <span className={`text-xl ${isActive || isPassed ? 'opacity-100' : 'opacity-40'}`}>
                {phaseInfo.icon}
              </span>
            </div>
            {index < phases.length - 1 && (
              <div className={`w-8 h-1 ${isPassed ? 'bg-gray-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
