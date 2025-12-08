import Stripe from "stripe"

// Stripe configuration
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
})

// Product and Price IDs
export const STRIPE_CONFIG = {
  PRODUCT_ID: "prod_T3PqwHzmvgaEH5",
  PRICE_ID: "price_1S7J18GwR80AtkOaDbKqjbse",
  MONTHLY_PRICE: 1650, // 月額1650円（税込）
}

// Helper functions
export const createStripeCustomer = async (email: string) => {
  return await stripe.customers.create({
    email,
    metadata: {
      source: "stackman_app",
    },
  })
}

export const createSubscription = async (customerId: string) => {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: STRIPE_CONFIG.PRICE_ID }],
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
  })
}
