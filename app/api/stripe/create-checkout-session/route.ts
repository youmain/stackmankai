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
  console.log("[v0] Stripe create-checkout-session API called")

  if (!stripe) {
    console.error("[v0] Stripe not initialized - STRIPE_SECRET_KEY missing")
    return NextResponse.json({ error: "Payment service not configured" }, { status: 503 })
  }

  try {
    const body = await request.json()
    console.log("[v0] Request body parsed:", body)

    const { email, priceId, paymentType } = body

    if (!email || !priceId || !paymentType) {
      console.log(
        "[v0] Missing required fields - email:",
        !!email,
        "priceId:",
        !!priceId,
        "paymentType:",
        !!paymentType,
      )
      return NextResponse.json({ error: "Email, Price ID, and Payment Type are required" }, { status: 400 })
    }

    console.log(
      "[v0] Creating checkout session for email:",
      email,
      "with price:",
      priceId,
      "payment type:",
      paymentType,
    )

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/customer-view?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/customer-auth`,
      metadata: {
        customer_email: email,
        payment_type: paymentType,
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
    }

    if (paymentType === "subscription") {
      // 月額継続課金（クレジットカードのみ）
      sessionConfig.mode = "subscription"
      sessionConfig.payment_method_types = ["card"]
      sessionConfig.payment_method_options = {
        card: {
          request_three_d_secure: "automatic",
        },
      }
      // Google PayとApple Payを明示的に無効化
      // sessionConfig.automatic_payment_methods = {
      //   enabled: false,
      // }
      sessionConfig.metadata!.service_type = "monthly_subscription"
    } else if (paymentType === "one_time") {
      sessionConfig.mode = "payment"
      sessionConfig.payment_method_types = [
        "card", // クレジットカード（Google Pay、Apple Pay含む）
      ]
      sessionConfig.metadata!.service_type = "quarterly_payment"
      sessionConfig.metadata!.service_duration_months = "3"
    } else {
      return NextResponse.json({ error: "Invalid payment type" }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    console.log("[v0] Checkout session created successfully:", session.id)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error("[v0] Stripe checkout session creation error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
