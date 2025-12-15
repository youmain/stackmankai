interface TurnNotificationProps {
  onSwitchToPoker: () => void
  onDismiss: () => void
}

export function TurnNotification({ onSwitchToPoker, onDismiss }: TurnNotificationProps) {
  return (
    <div className="fixed top-16 left-0 right-0 z-50 px-4 py-2 bg-yellow-500 text-black shadow-lg animate-pulse">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚠️</span>
          <span className="font-bold">あなたのターンです！</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSwitchToPoker}
            className="px-3 py-1 bg-black text-yellow-500 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            ポーカーモードへ
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-1 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
