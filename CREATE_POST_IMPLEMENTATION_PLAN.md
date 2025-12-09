# 新規投稿作成ページ（/create-post）実装計画書

## 概要

現在、`/create-post`ページが404エラーとなっており、ユーザーが新しいハンド投稿を作成できない状態です。本ドキュメントでは、この問題を解決するための詳細な実装計画を提示します。

---

## 1. 現状分析

### 1.1 既存のコンポーネント

投稿作成に必要なコンポーネントは**すでに実装されています**：

| コンポーネント | ファイルパス | 行数 | 説明 |
|---|---|---|---|
| ステップ1 | `components/post-creation/step-1-situation.tsx` | 135行 | 状況説明（ゲームタイプ、ブラインド、ポジション、スタック） |
| ステップ2 | `components/post-creation/step-2-preflop.tsx` | 210行 | プリフロップ（ホールカード、アクション、ベット額） |
| ステップ3 | `components/post-creation/step-3-flop.tsx` | 217行 | フロップ（コミュニティカード、アクション、ベット額） |
| ステップ4 | `components/post-creation/step-4-turn.tsx` | 207行 | ターン（コミュニティカード、アクション、ベット額） |
| ステップ5 | `components/post-creation/step-5-river.tsx` | 207行 | リバー（コミュニティカード、アクション、ベット額） |
| ステップ6 | `components/post-creation/step-6-reflection.tsx` | 92行 | 感想・まとめ（結果、考察、カテゴリ） |
| プレビュー | `components/post-creation/post-preview.tsx` | 329行 | 投稿プレビュー表示 |
| 公開設定 | `components/post-creation/visibility-settings.tsx` | 91行 | 公開範囲設定 |

**合計**: 1,488行のコンポーネントコードが既に実装済み

### 1.2 データベース関数

Firestoreの投稿関連関数も実装されています：

```typescript
// lib/firestore.ts (1547-1565行)

// 投稿作成
export const createPost = async (data: Partial<Post>): Promise<string> => {
  if (!isFirebaseConfigured()) return `mock_post_${Date.now()}`
  const postsCollection = getPostsCollection()
  const docRef = await addDoc(postsCollection, { ...data, createdAt: serverTimestamp() })
  return docRef.id
}

// 投稿取得
export const getPostById = async (postId: string): Promise<Post | null> => {
  if (!isFirebaseConfigured()) return null
  const postRef = doc(getPostsCollection(), postId)
  const snapshot = await getDoc(postRef)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() } as Post
}

// 投稿削除
export const deletePost = async (postId: string): Promise<void> => {
  if (!isFirebaseConfigured()) return
  await deleteDoc(doc(getPostsCollection(), postId))
}
```

### 1.3 データ型定義

PostDataインターフェースも完全に定義されています：

```typescript
// types/post.ts (111-130行)

export interface PostData {
  id: string
  title: string
  situation: string | SituationData
  visibility: "public" | "store" | "friends" | "private"
  seekingAdvice: boolean
  authorId: string
  authorName: string
  storeId?: string
  storeName?: string
  createdAt: Date
  likes?: number
  comments?: number
  views?: number
  preflop?: PreflopData
  flop?: FlopData
  turn?: TurnData
  river?: RiverData
  reflection?: ReflectionData
}
```

### 1.4 問題点

**唯一の問題**: `/app/create-post/page.tsx`ファイルが存在しないため、404エラーが発生しています。

---

## 2. 実装計画

### 2.1 必要なファイル

以下のファイルを新規作成する必要があります：

```
/home/ubuntu/stackmankai/app/create-post/page.tsx
```

### 2.2 ページ構造

新規投稿作成ページは、以下の構造で実装します：

```
┌─────────────────────────────────────────┐
│ ヘッダー（タイトル、進捗表示）           │
├─────────────────────────────────────────┤
│                                         │
│  ステップ1: 状況説明                     │
│  ステップ2: プリフロップ                 │
│  ステップ3: フロップ                     │
│  ステップ4: ターン                       │
│  ステップ5: リバー                       │
│  ステップ6: 感想・まとめ                 │
│                                         │
├─────────────────────────────────────────┤
│ ナビゲーション（前へ、次へ、保存）       │
└─────────────────────────────────────────┘
```

### 2.3 状態管理

投稿データは、Reactの`useState`を使用して管理します：

```typescript
const [currentStep, setCurrentStep] = useState(1)
const [postData, setPostData] = useState<Partial<PostData>>({
  title: "",
  situation: {
    gameType: "",
    blinds: "",
    position: "",
    stackSize: "",
    description: "",
  },
  visibility: "public",
  seekingAdvice: false,
  preflop: undefined,
  flop: undefined,
  turn: undefined,
  river: undefined,
  reflection: undefined,
})
```

### 2.4 ステップ管理

6つのステップを管理するための配列：

```typescript
const steps = [
  { id: 1, title: "状況説明", component: PostCreationStep1 },
  { id: 2, title: "プリフロップ", component: PostCreationStep2 },
  { id: 3, title: "フロップ", component: PostCreationStep3 },
  { id: 4, title: "ターン", component: PostCreationStep4 },
  { id: 5, title: "リバー", component: PostCreationStep5 },
  { id: 6, title: "感想・まとめ", component: PostCreationStep6 },
]
```

### 2.5 投稿保存処理

```typescript
const handleSave = async () => {
  try {
    // バリデーション
    if (!postData.title || !postData.situation) {
      alert("タイトルと状況説明は必須です")
      return
    }

    // 投稿データの準備
    const postToSave: Partial<PostData> = {
      ...postData,
      authorId: currentUser?.id || "anonymous",
      authorName: currentUser?.name || "匿名ユーザー",
      createdAt: new Date(),
      likes: 0,
      comments: 0,
      views: 0,
    }

    // Firestoreに保存
    const postId = await createPost(postToSave)

    // 成功メッセージ
    alert("投稿を作成しました！")

    // 投稿詳細ページにリダイレクト
    router.push(`/posts/${postId}`)
  } catch (error) {
    console.error("投稿の作成に失敗しました:", error)
    alert("投稿の作成に失敗しました")
  }
}
```

---

## 3. 実装コード

### 3.1 完全な実装例

以下は、`/app/create-post/page.tsx`の完全な実装例です：

```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Save, AlertCircle } from "lucide-react"
import Link from "next/link"
import { PostCreationStep1 } from "@/components/post-creation/step-1-situation"
import { PostCreationStep2 } from "@/components/post-creation/step-2-preflop"
import { PostCreationStep3 } from "@/components/post-creation/step-3-flop"
import { PostCreationStep4 } from "@/components/post-creation/step-4-turn"
import { PostCreationStep5 } from "@/components/post-creation/step-5-river"
import { PostCreationStep6 } from "@/components/post-creation/step-6-reflection"
import { VisibilitySettings } from "@/components/post-creation/visibility-settings"
import { createPost } from "@/lib/firestore"
import type { PostData, SituationData, PreflopData, FlopData, TurnData, RiverData, ReflectionData } from "@/types/post"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CreatePostPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  
  // 投稿データの状態管理
  const [title, setTitle] = useState("")
  const [situation, setSituation] = useState<SituationData>({
    gameType: "",
    blinds: "",
    position: "",
    stackSize: "",
    description: "",
  })
  const [visibility, setVisibility] = useState<"public" | "store" | "friends" | "private">("public")
  const [seekingAdvice, setSeekingAdvice] = useState(false)
  const [preflop, setPreflop] = useState<PreflopData | undefined>(undefined)
  const [flop, setFlop] = useState<FlopData | undefined>(undefined)
  const [turn, setTurn] = useState<TurnData | undefined>(undefined)
  const [river, setRiver] = useState<RiverData | undefined>(undefined)
  const [reflection, setReflection] = useState<ReflectionData | undefined>(undefined)

  const totalSteps = 6
  const progress = (currentStep / totalSteps) * 100

  // ステップの定義
  const steps = [
    {
      id: 1,
      title: "状況説明",
      description: "ゲームの基本情報を入力してください",
    },
    {
      id: 2,
      title: "プリフロップ",
      description: "プリフロップでのアクションを記録してください",
    },
    {
      id: 3,
      title: "フロップ",
      description: "フロップでのアクションを記録してください",
    },
    {
      id: 4,
      title: "ターン",
      description: "ターンでのアクションを記録してください",
    },
    {
      id: 5,
      title: "リバー",
      description: "リバーでのアクションを記録してください",
    },
    {
      id: 6,
      title: "感想・まとめ",
      description: "ハンドの結果と感想を記録してください",
    },
  ]

  const currentStepInfo = steps.find((s) => s.id === currentStep)

  // ナビゲーション
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // 投稿保存
  const handleSave = async () => {
    try {
      // バリデーション
      if (!title.trim()) {
        alert("タイトルを入力してください")
        return
      }

      if (!situation.description.trim()) {
        alert("状況説明を入力してください")
        setCurrentStep(1)
        return
      }

      setIsSaving(true)

      // 投稿データの準備
      const postToSave: Partial<PostData> = {
        title: title.trim(),
        situation: situation,
        visibility: visibility,
        seekingAdvice: seekingAdvice,
        authorId: "user1", // TODO: 実際のユーザーIDを取得
        authorName: "りゅうさん", // TODO: 実際のユーザー名を取得
        storeId: "store1", // TODO: 実際の店舗IDを取得
        storeName: "テスト店舗", // TODO: 実際の店舗名を取得
        likes: 0,
        comments: 0,
        views: 0,
      }

      // オプショナルなステップデータを追加
      if (preflop) postToSave.preflop = preflop
      if (flop) postToSave.flop = flop
      if (turn) postToSave.turn = turn
      if (river) postToSave.river = river
      if (reflection) postToSave.reflection = reflection

      console.log("投稿データ:", postToSave)

      // Firestoreに保存
      const postId = await createPost(postToSave)

      console.log("投稿ID:", postId)

      // 成功メッセージ
      alert("投稿を作成しました！")

      // 投稿詳細ページにリダイレクト
      router.push(`/posts/${postId}`)
    } catch (error) {
      console.error("投稿の作成に失敗しました:", error)
      alert("投稿の作成に失敗しました。もう一度お試しください。")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link href="/my-posts">
          <Button variant="ghost" className="flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            投稿一覧に戻る
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">新規投稿作成</CardTitle>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  ステップ {currentStep} / {totalSteps}: {currentStepInfo?.title}
                </span>
                <span className="text-sm font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* タイトル入力（全ステップで表示） */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="title">投稿タイトル *</Label>
            <Input
              id="title"
              placeholder="例: AA vs KK オールイン判断について"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* 公開設定（全ステップで表示） */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <VisibilitySettings
            visibility={visibility}
            seekingAdvice={seekingAdvice}
            onVisibilityChange={setVisibility}
            onSeekingAdviceChange={setSeekingAdvice}
          />
        </CardContent>
      </Card>

      {/* ステップコンテンツ */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{currentStepInfo?.title}</CardTitle>
          <p className="text-muted-foreground">{currentStepInfo?.description}</p>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <PostCreationStep1
              data={situation}
              onUpdate={(data) => setSituation({ ...situation, ...data })}
            />
          )}
          {currentStep === 2 && (
            <PostCreationStep2
              data={preflop || { action: "", betAmount: "", description: "" }}
              onUpdate={(data) => setPreflop({ ...preflop, ...data } as PreflopData)}
            />
          )}
          {currentStep === 3 && (
            <PostCreationStep3
              data={flop || { communityCards: [null, null, null], action: "", betAmount: "", description: "" }}
              onUpdate={(data) => setFlop({ ...flop, ...data } as FlopData)}
            />
          )}
          {currentStep === 4 && (
            <PostCreationStep4
              data={turn || { action: "", betAmount: "", description: "" }}
              onUpdate={(data) => setTurn({ ...turn, ...data } as TurnData)}
            />
          )}
          {currentStep === 5 && (
            <PostCreationStep5
              data={river || { action: "", betAmount: "", description: "" }}
              onUpdate={(data) => setRiver({ ...river, ...data } as RiverData)}
            />
          )}
          {currentStep === 6 && (
            <PostCreationStep6
              data={reflection || { result: "", thoughts: "", seekingAdvice: false, postCategory: "", visibility: "public" }}
              onUpdate={(data) => setReflection({ ...reflection, ...data } as ReflectionData)}
            />
          )}
        </CardContent>
      </Card>

      {/* ナビゲーションボタン */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              前のステップ
            </Button>

            <div className="flex items-center gap-2">
              {currentStep === totalSteps ? (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "保存中..." : "投稿を作成"}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  次のステップ
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 注意事項 */}
      <Alert className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          投稿は後から編集・削除できます。すべてのステップを入力する必要はありませんが、
          タイトルと状況説明は必須です。
        </AlertDescription>
      </Alert>
    </div>
  )
}
```

---

## 4. 実装手順

### ステップ1: ディレクトリ作成

```bash
mkdir -p /home/ubuntu/stackmankai/app/create-post
```

### ステップ2: ページファイル作成

```bash
touch /home/ubuntu/stackmankai/app/create-post/page.tsx
```

### ステップ3: コードの実装

上記の完全な実装例を`page.tsx`にコピーします。

### ステップ4: 動作確認

1. サーバーを起動
   ```bash
   cd /home/ubuntu/stackmankai && pnpm dev
   ```

2. ブラウザで以下のURLにアクセス
   ```
   https://3003-idacbyqu0j5u5dhou6oay-c6f155d2.manus-asia.computer/create-post
   ```

3. 各ステップで入力を行い、最後に「投稿を作成」ボタンをクリック

4. 投稿が正常に作成され、投稿詳細ページにリダイレクトされることを確認

### ステップ5: Gitコミット

```bash
cd /home/ubuntu/stackmankai
git add app/create-post/
git commit -m "Feature: Add create-post page for hand posting"
```

---

## 5. 追加の改善提案

### 5.1 認証機能の統合

現在のコードでは、`authorId`と`authorName`がハードコードされています。実際のユーザー情報を取得するように修正する必要があります：

```typescript
import { useAuth } from "@/hooks/use-auth" // 認証フックを作成

const { user } = useAuth()

const postToSave: Partial<PostData> = {
  // ...
  authorId: user?.id || "anonymous",
  authorName: user?.name || "匿名ユーザー",
  storeId: user?.storeId,
  storeName: user?.storeName,
}
```

### 5.2 下書き保存機能

ユーザーが途中で離脱しても、データを保持できるように下書き保存機能を追加：

```typescript
// LocalStorageに下書きを保存
const saveDraft = () => {
  const draft = {
    title,
    situation,
    visibility,
    seekingAdvice,
    preflop,
    flop,
    turn,
    river,
    reflection,
  }
  localStorage.setItem("postDraft", JSON.stringify(draft))
}

// ページ読み込み時に下書きを復元
useEffect(() => {
  const draft = localStorage.getItem("postDraft")
  if (draft) {
    const parsed = JSON.parse(draft)
    setTitle(parsed.title || "")
    setSituation(parsed.situation || { /* ... */ })
    // ...
  }
}, [])
```

### 5.3 バリデーション強化

各ステップでのバリデーションを強化：

```typescript
const validateStep = (step: number): boolean => {
  switch (step) {
    case 1:
      return !!(situation.gameType && situation.blinds && situation.position && situation.description)
    case 2:
      return !!(preflop?.action && preflop?.description)
    case 3:
      return !!(flop?.action && flop?.description)
    // ...
    default:
      return true
  }
}

const handleNext = () => {
  if (!validateStep(currentStep)) {
    alert("必須項目を入力してください")
    return
  }
  // ...
}
```

### 5.4 プレビュー機能

投稿前にプレビューを表示する機能：

```typescript
const [showPreview, setShowPreview] = useState(false)

// プレビューボタン
<Button
  variant="outline"
  onClick={() => setShowPreview(true)}
  className="flex items-center gap-2"
>
  <Eye className="w-4 h-4" />
  プレビュー
</Button>

// プレビューダイアログ
{showPreview && (
  <Dialog open={showPreview} onOpenChange={setShowPreview}>
    <DialogContent className="max-w-4xl">
      <PostPreview data={/* 投稿データ */} />
    </DialogContent>
  </Dialog>
)}
```

### 5.5 画像アップロード機能

ハンドの画像をアップロードできる機能を追加：

```typescript
const [images, setImages] = useState<string[]>([])

const handleImageUpload = async (file: File) => {
  // Firebase Storageにアップロード
  const url = await uploadImage(file)
  setImages([...images, url])
}
```

---

## 6. テスト計画

### 6.1 単体テスト

各ステップコンポーネントが正しく動作することを確認：

- ステップ1: 状況説明の入力
- ステップ2: プリフロップの入力
- ステップ3: フロップの入力
- ステップ4: ターンの入力
- ステップ5: リバーの入力
- ステップ6: 感想・まとめの入力

### 6.2 統合テスト

全体のフローが正しく動作することを確認：

1. `/create-post`ページにアクセス
2. タイトルを入力
3. 公開設定を選択
4. 各ステップで必要な情報を入力
5. 「投稿を作成」ボタンをクリック
6. 投稿が正常に作成されることを確認
7. 投稿詳細ページにリダイレクトされることを確認
8. 投稿一覧ページに新しい投稿が表示されることを確認

### 6.3 エラーハンドリングテスト

エラーケースが正しく処理されることを確認：

- タイトル未入力時のエラー
- 状況説明未入力時のエラー
- Firestore接続エラー時の処理
- ネットワークエラー時の処理

---

## 7. 見積もり

### 7.1 開発時間

| タスク | 時間 |
|---|---|
| ページファイルの作成 | 10分 |
| コードの実装 | 30分 |
| 動作確認 | 20分 |
| バグ修正 | 20分 |
| **合計** | **約1.5時間** |

### 7.2 追加機能の開発時間

| 機能 | 時間 |
|---|---|
| 認証機能の統合 | 1時間 |
| 下書き保存機能 | 1時間 |
| バリデーション強化 | 30分 |
| プレビュー機能 | 1時間 |
| 画像アップロード機能 | 2時間 |
| **合計** | **約5.5時間** |

---

## 8. まとめ

新規投稿作成ページの実装は、既存のコンポーネントとデータベース関数を活用することで、**比較的短時間で完了できます**。

### 必要な作業

1. ✅ **既存コンポーネントの確認**（完了）
2. ✅ **データベース関数の確認**（完了）
3. ✅ **データ型定義の確認**（完了）
4. ⏳ **ページファイルの作成**（未実施）
5. ⏳ **コードの実装**（未実施）
6. ⏳ **動作確認**（未実施）
7. ⏳ **Gitコミット**（未実施）

### 優先度

- **高**: 基本的な投稿作成機能の実装
- **中**: バリデーション強化、プレビュー機能
- **低**: 下書き保存、画像アップロード

この実装計画に従って作業を進めることで、ユーザーがハンド投稿を作成できるようになり、404エラーが解決されます。
