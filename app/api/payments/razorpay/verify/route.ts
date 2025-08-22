import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { neon } from "@neondatabase/serverless"

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 })
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
    }

    // Update order in DB
    const orderResult = await sql`
      UPDATE orders
      SET payment_status = 'paid',
          status = 'confirmed',
          razorpay_order_id = ${razorpay_order_id},
          razorpay_payment_id = ${razorpay_payment_id},
          updated_at = CURRENT_TIMESTAMP
      WHERE razorpay_order_id = ${razorpay_order_id}
      RETURNING *
    `

    if (orderResult.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const order = orderResult[0]

    // Update stock quantities
    const orderItems = await sql`
      SELECT product_id, quantity FROM order_items WHERE order_id = ${order.id}
    `

    for (const item of orderItems) {
      await sql`
        UPDATE products
        SET stock_quantity = GREATEST(0, stock_quantity - ${item.quantity})
        WHERE id = ${item.product_id}
      `
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      payment_id: razorpay_payment_id,
      message: "Payment verified successfully",
    })
  } catch (error) {
    console.error("Error verifying payment:", error)
    const errorMessage = error instanceof Error ? error.message : "Payment verification failed"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
