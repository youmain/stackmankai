import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase-admin"
import { AI_PLAYERS } from "@/lib/ai-players-data"

export const dynamic = "force-dynamic"

async function generateAIComment(prompt: string): Promise<string> {
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.9,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

export async function GET() {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "DEEPSEEK_API_KEY環境変数が設定されていません。v0の設定画面で環境変数を追加してください。",
        },
        { status: 500 },
      )
    }

    console.log("[v0] 🤖 AIコメント手動生成開始")

    const now = new Date()
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)

    const db = getAdminDb()
    const postsSnapshot = await db.collection("posts")
      .where("createdAt", ">=", tenDaysAgo)
      .get()

    console.log(`[v0] 📋 処理対象の投稿数: ${postsSnapshot.size}`)

    if (postsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: "10日以内の投稿がありません",
        postsProcessed: 0,
        commentsGenerated: 0,
      })
    }

    let totalCommentsGenerated = 0
    const results = []

    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data()
      const postId = postDoc.id

      try {
        const commentsSnapshot = await db.collection("comments")
          .where("postId", "==", postId)
          .get()

        const existingComments = commentsSnapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        }))

        console.log(`[v0] 📝 投稿 ${postId} の既存コメント数: ${existingComments.length}`)

        const existingAIPlayerIds = new Set<string>(
          existingComments
            .filter((comment: any) => comment.isAIComment === true)
            .map((comment: any) => comment.aiPlayerId),
        )

        console.log(`[v0] 🤖 既にコメント済みのAIプレイヤー数: ${existingAIPlayerIds.size}`)

        const authorReplies = existingComments.filter(
          (comment: any) => comment.authorId === postData.authorId && comment.isAIComment !== true,
        )

        const repliedAIPlayers = new Set<string>()
        for (const reply of authorReplies) {
          const previousComments = existingComments
            .filter(
              (c: any) => new Date(c.createdAt?.toDate()).getTime() < new Date(reply.createdAt?.toDate()).getTime(),
            )
            .sort(
              (a: any, b: any) => new Date(b.createdAt?.toDate()).getTime() - new Date(a.createdAt?.toDate()).getTime(),
            )

          if (previousComments.length > 0 && previousComments[0].isAIComment) {
            repliedAIPlayers.add(previousComments[0].aiPlayerId)
          }
        }

        const numComments = Math.floor(Math.random() * 3) + 1
        console.log(`[v0] 🎲 投稿 ${postId} に ${numComments} 個のコメントを生成`)

        let commentsForThisPost = 0

        for (const aiPlayerId of repliedAIPlayers) {
          if (commentsForThisPost >= numComments) break

          const aiPlayer = AI_PLAYERS.find((p) => p.id === aiPlayerId)
          if (!aiPlayer) continue

          const replyPrompt = `
あなたは${aiPlayer.name}です。

【あなたの特徴】
プレイスタイル: ${aiPlayer.playStyle}
性格: ${aiPlayer.persona}

【投稿内容】
ゲームタイプ: ${postData.gameType || "不明"}
ブラインド: ${postData.blinds || "不明"}
ポジション: ${postData.position || "不明"}
スタックサイズ: ${postData.stackSize || "不明"}
状況説明: ${postData.description || ""}

【指示】
投稿者があなたの前回のコメントに返信しました。
その返信に対して、あなたのプレイスタイルと性格に基づいて、さらに詳しいアドバイスや補足説明を150-250文字程度で書いてください。
フレンドリーで建設的なトーンを保ちつつ、実践的なアドバイスを提供してください。
`

          const text = await generateAIComment(replyPrompt)

          console.log(`[v0] ✅ ${aiPlayer.name} の返信コメント生成完了`)

          await db.collection("comments").add({
            postId,
            authorId: aiPlayer.id,
            authorName: aiPlayer.name,
            content: text,
            isAIComment: true,
            aiPlayerId: aiPlayer.id,
            aiPlayerName: aiPlayer.name,
            createdAt: new Date(),
          })

          commentsForThisPost++
          totalCommentsGenerated++
        }

        const activeAIPlayers = AI_PLAYERS.filter((p) => p.isActive && !existingAIPlayerIds.has(p.id))

        if (activeAIPlayers.length === 0) {
          console.log(`[v0] ⚠️ 投稿 ${postId} には全てのAIプレイヤーが既にコメント済みです`)
          results.push({
            postId,
            commentsGenerated: commentsForThisPost,
            repliesGenerated: repliedAIPlayers.size,
            skipped: "全てのAIプレイヤーが既にコメント済み",
          })
          continue
        }

        const remainingComments = numComments - commentsForThisPost

        for (let i = 0; i < remainingComments; i++) {
          if (activeAIPlayers.length === 0) {
            console.log(`[v0] ⚠️ これ以上コメント可能なAIプレイヤーがいません`)
            break
          }

          const randomIndex = Math.floor(Math.random() * activeAIPlayers.length)
          const randomPlayer = activeAIPlayers[randomIndex]

          activeAIPlayers.splice(randomIndex, 1)

          const existingAIComments = existingComments
            .filter((c: any) => c.isAIComment && c.aiPlayerId === randomPlayer.id)
            .map((c: any) => c.content)

          const existingCommentsText =
            existingAIComments.length > 0
              ? `\n\n【既存のあなたのコメント】\n${existingAIComments.join("\n\n")}\n\n上記とは異なる視点や新しい情報を提供してください。`
              : ""

          const prompt = `
あなたは${randomPlayer.name}です。

【あなたの特徴】
プレイスタイル: ${randomPlayer.playStyle}
性格: ${randomPlayer.persona}

【投稿内容】
ゲームタイプ: ${postData.gameType || "不明"}
ブラインド: ${postData.blinds || "不明"}
ポジション: ${postData.position || "不明"}
スタックサイズ: ${postData.stackSize || "不明"}
状況説明: ${postData.description || ""}${existingCommentsText}

【指示】
上記の投稿に対して、あなたのプレイスタイルと性格に基づいて、具体的なアドバイスやコメントを150-250文字程度で書いてください。
あなたの個性を出しつつ、実践的で役立つアドバイスを提供してください。
毎回異なる視点や新しい情報を提供し、同じ内容を繰り返さないでください。
`

          try {
            console.log(`[v0] 🔄 ${randomPlayer.name} のコメント生成開始...`)

            const text = await generateAIComment(prompt)

            console.log(`[v0] ✅ ${randomPlayer.name} のコメント生成完了`)

            await db.collection("comments").add({
              postId,
              authorId: randomPlayer.id,
              authorName: randomPlayer.name,
              content: text,
              isAIComment: true,
              aiPlayerId: randomPlayer.id,
              aiPlayerName: randomPlayer.name,
              createdAt: new Date(),
            })

            commentsForThisPost++
            totalCommentsGenerated++
          } catch (aiError) {
            console.error(`[v0] ❌ ${randomPlayer.name} のコメント生成エラー:`, aiError)
            throw aiError
          }
        }

        results.push({
          postId,
          commentsGenerated: commentsForThisPost,
          repliesGenerated: repliedAIPlayers.size,
        })
      } catch (error) {
        console.error(`[v0] ❌ 投稿 ${postId} の処理中にエラー:`, error)
        results.push({
          postId,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    console.log(`[v0] 🎉 AIコメント生成完了: ${totalCommentsGenerated}件`)

    return NextResponse.json({
      success: true,
      message: `${totalCommentsGenerated}件のAIコメントを生成しました`,
      postsProcessed: postsSnapshot.size,
      commentsGenerated: totalCommentsGenerated,
      details: results,
    })
  } catch (error) {
    console.error("[v0] ❌ AIコメント生成エラー:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
