"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { addPlayer } from "@/lib/firestore"
import { Upload } from "lucide-react"

interface PlayerData {
  name: string
  systemBalance: number
}

interface SimpleBulkImportProps {
  onImportComplete: () => void
}

interface ParsedJsonData {
  players?: PlayerData[]
}

export function SimpleBulkImport({ onImportComplete }: SimpleBulkImportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [jsonData, setJsonData] = useState("")
  const [players, setPlayers] = useState<PlayerData[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileUpload = (file: File) => {
    console.log("[v0] ファイルアップロード開始:", file.name, "タイプ:", file.type, "サイズ:", file.size)

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        console.log("[v0] ファイル読み取り成功:", content.length, "文字")
        setJsonData(content)
        // 自動的にパースを実行
        parseJSONContent(content)
      } catch (error) {
        console.error("[v0] ファイル読み取りエラー:", error)
        alert(`ファイルの読み取りに失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`)
      }
    }

    reader.onerror = () => {
      console.error("[v0] FileReader エラー:", reader.error)
      alert("ファイルの読み取りに失敗しました")
    }

    reader.readAsText(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      console.log("[v0] ファイルドロップ検出:", files[0].name)
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      console.log("[v0] ファイル選択検出:", files[0].name)
      handleFileUpload(files[0])
    }
  }

  const parseJSONContent = (content: string) => {
    try {
      console.log("[v0] JSONデータをパース中...")
      const data: PlayerData[] | ParsedJsonData = JSON.parse(content)

      let playersArray: PlayerData[] = []

      if (Array.isArray(data)) {
        playersArray = data
        console.log("[v0] 直接配列として検出:", data.length, "件")
      } else if (data.players && Array.isArray(data.players)) {
        playersArray = data.players
        console.log("[v0] playersプロパティとして検出:", data.players.length, "件")
      } else {
        throw new Error("プレイヤーデータが見つかりません。配列またはplayersプロパティが必要です。")
      }

      const extractedPlayers = playersArray
        .filter((player): player is PlayerData => {
          return typeof player === "object" && player !== null && "name" in player && typeof player.name === "string"
        })
        .map((player) => ({
          name: player.name,
          systemBalance: typeof player.systemBalance === "number" ? player.systemBalance : 0,
        }))

      if (extractedPlayers.length === 0) {
        throw new Error("有効なプレイヤーデータが見つかりません。nameフィールドが必要です。")
      }

      setPlayers(extractedPlayers)
      console.log("[v0] パース成功:", extractedPlayers.length, "人のプレイヤー")
      console.log("[v0] 最初の3人:", extractedPlayers.slice(0, 3))
    } catch (error) {
      console.error("[v0] JSONパースエラー:", error)
      alert(`JSONデータの形式が正しくありません: ${error instanceof Error ? error.message : "不明なエラー"}`)
    }
  }

  const parseJSON = () => {
    parseJSONContent(jsonData)
  }

  const handleImport = async () => {
    if (players.length === 0) {
      alert("まずJSONデータをパースしてください")
      return
    }

    setIsImporting(true)
    setImportResults(null)

    let successCount = 0
    let failedCount = 0
    const errors: string[] = []

    console.log("[v0] 一括インポート開始:", players.length, "人")

    for (const player of players) {
      try {
        console.log("[v0] プレイヤー登録中:", player.name, "システム残高:", player.systemBalance)

        await addPlayer({
          name: player.name,
          pokerName: "",
          furigana: "",
          systemBalance: player.systemBalance,
        })

        successCount++
        console.log("[v0] 登録成功:", player.name)
      } catch (error) {
        failedCount++
        const errorMessage = `${player.name}: ${error instanceof Error ? error.message : "不明なエラー"}`
        errors.push(errorMessage)
        console.error("[v0] 登録失敗:", errorMessage)
      }
    }

    setImportResults({
      success: successCount,
      failed: failedCount,
      errors,
    })

    setIsImporting(false)

    if (successCount > 0) {
      onImportComplete()
    }

    console.log("[v0] インポート完了 - 成功:", successCount, "失敗:", failedCount)
  }

  const resetImport = () => {
    setJsonData("")
    setPlayers([])
    setImportResults(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">一括登録（JSON）</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>プレイヤー一括登録</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <div className="text-sm text-muted-foreground mb-2">ファイルをドラッグ&ドロップ、または</div>
            <label htmlFor="file-upload">
              <Button variant="outline" size="sm" asChild>
                <span>ファイルを選択</span>
              </Button>
              <input id="file-upload" type="file" accept=".json,.txt" onChange={handleFileSelect} className="hidden" />
            </label>
            <div className="text-xs text-muted-foreground mt-2">対応形式: JSON, TXT</div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">または</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">JSONデータを直接貼り付け</label>
            <Textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder='例: [{"name": "プレイヤー1", "systemBalance": 10000}]'
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="flex gap-2 mt-2">
              <Button onClick={parseJSON} disabled={!jsonData.trim()}>
                データを解析
              </Button>
              <Button variant="outline" onClick={resetImport}>
                リセット
              </Button>
            </div>
          </div>

          {players.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  プレビュー
                  <Badge variant="secondary">{players.length}人</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {players.slice(0, 20).map((player, index) => (
                      <div key={index} className="p-2 border rounded text-sm">
                        <div className="font-medium">{player.name}</div>
                        <div className="text-muted-foreground">{player.systemBalance.toLocaleString()}©</div>
                      </div>
                    ))}
                  </div>
                  {players.length > 20 && (
                    <div className="text-center text-muted-foreground mt-2">...他{players.length - 20}人</div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleImport} disabled={isImporting} className="flex-1">
                    {isImporting ? "登録中..." : `${players.length}人を一括登録`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {importResults && (
            <Card>
              <CardHeader>
                <CardTitle>インポート結果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex gap-4">
                    <Badge variant="default">成功: {importResults.success}人</Badge>
                    {importResults.failed > 0 && <Badge variant="destructive">失敗: {importResults.failed}人</Badge>}
                  </div>

                  {importResults.errors.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-1">エラー詳細:</div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {importResults.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-600 p-1 border-l-2 border-red-200">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
