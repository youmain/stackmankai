import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Stripe環境変数の確認（ビルド時は警告のみ）
if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== 'production') {
  console.warn("[v0] STRIPE_SECRET_KEY is not configured - Stripe features will be disabled")
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    })
  : null

export async function POST(request: NextRequest) {
  console.log("[v0] Stripe create-customer API called")

  if (!stripe) {
    console.error("[v0] Stripe not initialized - missing STRIPE_SECRET_KEY")
    return NextResponse.json({ error: "Payment service not configured" }, { status: 503 })
  }

  try {
    let body
    try {
      body = await request.json()
      console.log("[v0] Request body parsed:", body)
    } catch (parseError) {
      console.error("[v0] JSON parse error:", parseError)
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 })
    }

    const { email } = body

    if (!email) {
      console.log("[v0] Email missing from request")
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log("[v0] Creating Stripe customer for email:", email)

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        source: "stackman_app",
      },
    })

    console.log("[v0] Stripe customer created successfully:", customer.id)

    return NextResponse.json({
      customerId: customer.id,
      email: customer.email,
    })
  } catch (error) {
    console.error("[v0] Stripe customer creation error:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
