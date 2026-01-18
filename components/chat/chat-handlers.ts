import { sendChatMessage, setUserPresence, removeUserPresence } from "@/lib/firestore"
import type { ChatMessage } from "@/types"

export async function handleSendMessage(
  newMessage: string,
  storeId: string | undefined,
  customerAccountId: string | undefined,
  customerAccountName: string | undefined,
  setNewMessage: (msg: string) => void,
  setIsSending: (sending: boolean) => void,
  setError: (error: string) => void,
): Promise<void> {
  if (!newMessage.trim() || !storeId || !customerAccountId) {
    setError("メッセージが空です")
    return
  }

  setIsSending(true)
  setError("")

  try {
    await sendChatMessage(storeId, {
      userId: customerAccountId,
      userName: customerAccountName || "Unknown",
      message: newMessage,
      timestamp: new Date(),
    })
    setNewMessage("")
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "メッセージ送信に失敗しました"
    setError(errorMessage)
    console.error("Failed to send message:", err)
  } finally {
    setIsSending(false)
  }
}

export async function handleSetUserPresence(
  storeId: string | undefined,
  userId: string | undefined,
  userName: string | undefined,
  setError: (error: string) => void,
): Promise<void> {
  if (!storeId || !userId || !userName) {
    return
  }

  try {
    await setUserPresence(storeId, userId, userName)
  } catch (err) {
    console.error("Failed to set user presence:", err)
    setError("ユーザープレゼンスの設定に失敗しました")
  }
}

export async function handleRemoveUserPresence(
  storeId: string | undefined,
  userId: string | undefined,
  setError: (error: string) => void,
): Promise<void> {
  if (!storeId || !userId) {
    return
  }

  try {
    await removeUserPresence(storeId, userId)
  } catch (err) {
    console.error("Failed to remove user presence:", err)
    setError("ユーザープレゼンスの削除に失敗しました")
  }
}

export function handleClearHistory(
  storeId: string | undefined,
  setHiddenMessageIds: (ids: Set<string>) => void,
): void {
  if (!storeId) return

  const storageKey = `hiddenMessages_${storeId}`
  localStorage.setItem(storageKey, JSON.stringify([]))
  setHiddenMessageIds(new Set())
}

export function toggleMessageVisibility(
  messageId: string,
  hiddenMessageIds: Set<string>,
  setHiddenMessageIds: (ids: Set<string>) => void,
  storeId: string | undefined,
): void {
  if (!storeId) return

  const newHidden = new Set(hiddenMessageIds)
  if (newHidden.has(messageId)) {
    newHidden.delete(messageId)
  } else {
    newHidden.add(messageId)
  }

  setHiddenMessageIds(newHidden)

  const storageKey = `hiddenMessages_${storeId}`
  localStorage.setItem(storageKey, JSON.stringify(Array.from(newHidden)))
}
