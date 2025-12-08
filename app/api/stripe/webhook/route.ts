import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { updateCustomerPayment, createPaymentHistory, createCustomerAccount } from "@/lib/firestore"

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== 'production') {
  console.warn("[v0] STRIPE_SECRET_KEY is not configured - Stripe features will be disabled")
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn("[v0] STRIPE_WEBHOOK_SECRET is not configured - Webhook validation will be disabled")
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    })
  : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    console.error("[v0] Stripe webhook not configured - missing environment variables")
    return NextResponse.json({ error: "Webhook service not configured" }, { status: 503 })
  }

  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    console.log("[v0] 🔔 Stripe webhook received:", event.type)

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.CheckoutSession
        const customerEmail = session.metadata?.customer_email
        const paymentType = session.metadata?.payment_type

        console.log("[v0] 💳 Checkout session completed:", {
          sessionId: session.id,
          mode: session.mode,
          paymentType,
          customerEmail,
        })

        if (session.mode === "payment" && paymentType === "one_time") {
          const serviceDurationMonths = Number.parseInt(session.metadata?.service_duration_months || "3")
          const accessExpiresAt = new Date()
          accessExpiresAt.setMonth(accessExpiresAt.getMonth() + serviceDurationMonths)

          // 顧客アカウントを作成または更新
          let customerId = session.customer as string
          if (!customerId && customerEmail) {
            customerId = await createCustomerAccount(customerEmail, session.customer as string)
          }

          await updateCustomerPayment(customerId, {
            paymentStatus: "active",
            accessExpiresAt,
            lastPaymentDate: new Date(),
            paymentMethod: session.payment_method_types?.[0] || "unknown",
          })

          console.log(
            `[v0] ✅ 3ヶ月分一括払い完了 - ${customerEmail}, アクセス期限: ${accessExpiresAt.toLocaleDateString("ja-JP")}`,
          )
        } else if (session.mode === "subscription" && paymentType === "subscription") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

          let customerId = session.customer as string
          if (!customerId && customerEmail) {
            customerId = await createCustomerAccount(
              customerEmail,
              session.customer as string,
              session.subscription as string,
            )
          }

          await updateCustomerPayment(customerId, {
            paymentStatus: "active",
            subscriptionId: session.subscription as string,
            subscriptionStatus: "active",
            lastPaymentDate: new Date(),
            paymentMethod: "card",
          })

          console.log(`[v0] ✅ 月額継続課金開始 - ${customerEmail}, サブスクリプション: ${session.subscription}`)
        }
        break
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        await createPaymentHistory({
          customerId: paymentIntent.customer as string,
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: "succeeded",
          description: `決済成功 - ${new Date().toLocaleDateString("ja-JP")}`,
          paymentMethod: paymentIntent.payment_method_types?.[0] || "unknown",
        })

        console.log("[v0] ✅ Payment recorded:", paymentIntent.id)
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        await createPaymentHistory({
          customerId: paymentIntent.customer as string,
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: "failed",
          description: `決済失敗 - ${new Date().toLocaleDateString("ja-JP")}`,
          paymentMethod: paymentIntent.payment_method_types?.[0] || "unknown",
        })

        console.log("[v0] ❌ Payment failed:", paymentIntent.id)
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          await updateCustomerPayment(invoice.customer as string, {
            paymentStatus: "active",
            lastPaymentDate: new Date(),
            paymentMethod: "card",
          })

          console.log("[v0] ✅ 継続課金支払い成功:", invoice.subscription)
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          await updateCustomerPayment(invoice.customer as string, {
            paymentStatus: "inactive",
            paymentMethod: "card",
          })

          console.log("[v0] ❌ 継続課金支払い失敗:", invoice.subscription)
        }
        break
      }

      default:
        console.log("[v0] 🤷 Unhandled webhook event:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] ❌ Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
