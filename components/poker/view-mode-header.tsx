import { ViewMode } from '@/types/poker'

interface ViewModeHeaderProps {
  viewMode: ViewMode
  onModeChange: (mode: ViewMode) => void
}

export function ViewModeHeader({ viewMode, onModeChange }: ViewModeHeaderProps) {
  return (
    <div className="flex items-center justify-center gap-1 bg-slate-800 border-b border-slate-700 px-2 py-2">
      <button
        onClick={() => onModeChange('poker')}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all ${
          viewMode === 'poker'
            ? 'bg-blue-600 text-white shadow-lg'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
      >
        <span className="text-lg">🎴</span>
        <span className="text-sm">ポーカー</span>
      </button>
      
      <button
        onClick={() => onModeChange('chat')}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all ${
          viewMode === 'chat'
            ? 'bg-green-600 text-white shadow-lg'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
      >
        <span className="text-lg">💬</span>
        <span className="text-sm">チャット</span>
      </button>
      
      <button
        onClick={() => onModeChange('spectate')}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all ${
          viewMode === 'spectate'
            ? 'bg-purple-600 text-white shadow-lg'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
      >
        <span className="text-lg">👁</span>
        <span className="text-sm">観戦</span>
      </button>
    </div>
  )
}
