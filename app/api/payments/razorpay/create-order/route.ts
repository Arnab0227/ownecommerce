import { type NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = "INR" } = await request.json()

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("[v0] Razorpay environment variables missing:", {
        keyId: !!process.env.RAZORPAY_KEY_ID,
        keySecret: !!process.env.RAZORPAY_KEY_SECRET,
      })
      return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 })
    }

    if (!amount || amount <= 0) {
      console.error("[v0] Invalid amount received:", amount)
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    console.log("[v0] Creating Razorpay order with amount:", amount)

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const options = {
  amount: Math.round(amount * 100), // paise
  currency,
  receipt: `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`, 
  payment_capture: 1,
}

    const order = await razorpay.orders.create(options)
    console.log("[v0] Razorpay order created successfully:", order.id)

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    })
  } catch (error) {
    console.error("[v0] Error creating Razorpay order:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create payment order"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
