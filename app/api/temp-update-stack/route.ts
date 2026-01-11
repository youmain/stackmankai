import { NextRequest, NextResponse } from "next/server"
import initializeAdminFirebase, { getAdminDb } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const { uid, newStack } = await request.json()

    if (!uid || typeof newStack !== "number") {
      return NextResponse.json(
        { error: "uid and newStack are required" },
        { status: 400 }
      )
    }

    console.log(`[API] Updating stack for UID: ${uid} to ${newStack}`)

    // Firebase Admin SDKを初期化
    const adminApp = initializeAdminFirebase()
    if (!adminApp) {
      return NextResponse.json(
        { error: "Firebase Admin SDK is not initialized" },
        { status: 500 }
      )
    }

    const db = getAdminDb()

    // customerAccountsコレクションのドキュメントを更新
    const customerDocRef = db.collection("customerAccounts").doc(uid)
    await customerDocRef.update({
      stack: newStack,
      updatedAt: new Date(),
    })

    console.log(`[API] Stack updated successfully for UID: ${uid}`)

    return NextResponse.json(
      { success: true, message: `Stack updated to ${newStack}` },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[API] Error updating stack:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update stack" },
      { status: 500 }
    )
  }
}
