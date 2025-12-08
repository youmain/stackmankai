import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Stripe環境変数の確認（ビルド時は警告のみ）
if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== 'production') {
  console.warn("[v0] STRIPE_SECRET_KEY is not configured - Stripe features will be disabled")
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-11-17.clover",
    })
  : null

export async function POST(request: NextRequest) {
  console.log("[v0] Stripe create-subscription API called")

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

    const { customerId, priceId } = body

    if (!customerId || !priceId) {
      console.log("[v0] Missing required fields - customerId:", !!customerId, "priceId:", !!priceId)
      return NextResponse.json({ error: "Customer ID and Price ID are required" }, { status: 400 })
    }

    console.log("[v0] Creating subscription for customer:", customerId, "with price:", priceId)

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    })

    console.log("[v0] Subscription created successfully:", subscription.id)

    const invoice = subscription.latest_invoice as Stripe.Invoice
    const paymentIntent = (invoice as any).payment_intent as Stripe.PaymentIntent

    console.log("[v0] Payment intent client secret generated")

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      status: subscription.status,
    })
  } catch (error) {
    console.error("[v0] Stripe subscription creation error:", error)
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}
