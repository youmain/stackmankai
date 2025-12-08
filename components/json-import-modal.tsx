"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Users, AlertCircle } from "lucide-react"

interface JSONImportModalProps {
  open: boolean
  onClose: () => void
  onImport: (data: any[]) => Promise<void>
}

export function JSONImportModal({ open, onClose, onImport }: JSONImportModalProps) {
  const [jsonText, setJsonText] = useState("")
  const [parsedData, setParsedData] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleParseJSON = () => {
    try {
      const data = JSON.parse(jsonText)
      if (!Array.isArray(data)) {
        setError("JSONデータは配列である必要があります")
        setParsedData(null)
        return
      }

      // Validate required fields
      const validPlayers = data.filter((player) => player && typeof player === "object" && player.name)

      if (validPlayers.length === 0) {
        setError("有効なプレイヤーデータが見つかりません（nameフィールドが必要です）")
        setParsedData(null)
        return
      }

      setParsedData(validPlayers)
      setError(null)
    } catch (err) {
      setError("JSONの解析に失敗しました。正しいJSON形式で入力してください。")
      setParsedData(null)
    }
  }

  const handleImport = async () => {
    if (!parsedData) return

    setIsImporting(true)
    try {
      console.log("[v0] JSONインポート開始:", { プレイヤー数: parsedData.length })
      await onImport(parsedData)
      console.log("[v0] JSONインポート成功完了")
      onClose()
      setJsonText("")
      setParsedData(null)
      setError(null)
    } catch (err) {
      console.error("[v0] JSONインポートエラー:", err)
      setError(`インポートに失敗しました: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    onClose()
    setJsonText("")
    setParsedData(null)
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            JSONデータインポート
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">JSONデータを貼り付けてください</label>
            <Textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='[{"name": "プレイヤー名", "systemBalance": 10000}, ...]'
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="flex gap-2 mt-2">
              <Button onClick={handleParseJSON} disabled={!jsonText.trim()} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                データを解析
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">エラー</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

          {parsedData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  プレビュー ({parsedData.length}人)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
                  {parsedData.slice(0, 20).map((player, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-medium truncate">{player.name}</span>
                          {player.pokerName && (
                            <span className="text-xs text-gray-500 truncate">({player.pokerName})</span>
                          )}
                          {player.furigana && <span className="text-xs text-gray-400 truncate">{player.furigana}</span>}
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-2">
                          <Badge variant="outline" className="text-xs">
                            {(player.systemBalance || 0).toLocaleString()}©
                          </Badge>
                          {player.isSpecial && (
                            <Badge variant="destructive" className="text-xs">
                              特別
                            </Badge>
                          )}
                          {player.isDeduction && (
                            <Badge variant="secondary" className="text-xs">
                              差引
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {parsedData.length > 20 && (
                    <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center">
                      <span className="text-gray-600 text-sm">...他{parsedData.length - 20}人</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">インポート設定</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 登録日は全て今日の日付になります</li>
                    <li>• 同じ名前のプレイヤーは重複チェックでスキップされます</li>
                    <li>• システム残高、読み仮名、ポーカーネーム、特別仕様も含めてインポートされます</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              キャンセル
            </Button>
            <Button onClick={handleImport} disabled={!parsedData || isImporting}>
              {isImporting ? "インポート中..." : `${parsedData?.length || 0}人をインポート`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
