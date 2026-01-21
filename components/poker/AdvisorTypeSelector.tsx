"use client"

import React, { useState } from "react"
import type { AdvisorType } from "@/lib/ai-poker-advisor"

interface AdvisorTypeSelectorProps {
  onSelect: (type: AdvisorType) => void
  currentType?: AdvisorType
}

export const AdvisorTypeSelector: React.FC<AdvisorTypeSelectorProps> = ({
  onSelect,
  currentType = "balanced",
}) => {
  const [selectedType, setSelectedType] = useState<AdvisorType>(currentType)

  const advisorTypes: Array<{
    type: AdvisorType
    label: string
    description: string
    icon: string
  }> = [
    {
      type: "exploit",
      label: "エクスプロイト型",
      description: "相手の弱点を最大限活用。相手の統計情報を積極的に利用します。",
      icon: "⚔️",
    },
    {
      type: "balanced",
      label: "バランス型",
      description: "GTO理論とエクスプロイトを五分五分で考慮。最もバランスの取れた戦略です。",
      icon: "⚖️",
    },
    {
      type: "gto",
      label: "GTO型",
      description: "相手の情報を一切考慮しない。数学的に最適なアクションのみを提供します。",
      icon: "🧮",
    },
  ]

  const handleSelect = (type: AdvisorType) => {
    setSelectedType(type)
    onSelect(type)
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-bold text-white mb-4">AIアドバイザータイプを選択</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {advisorTypes.map((advisor) => (
          <button
            key={advisor.type}
            onClick={() => handleSelect(advisor.type)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              selectedType === advisor.type
                ? "border-blue-500 bg-blue-500 bg-opacity-10"
                : "border-slate-600 bg-slate-700 bg-opacity-50 hover:border-slate-500"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{advisor.icon}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">{advisor.label}</h4>
                <p className="text-sm text-slate-300">{advisor.description}</p>
              </div>
            </div>
            {selectedType === advisor.type && (
              <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-blue-400 font-semibold">選択中</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
