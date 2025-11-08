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

    try {
      await awardLoyaltyPoints(sql, order.user_id, order.total_amount, order.id, order.order_number)
    } catch (loyaltyError) {
      console.error("Failed to award loyalty points:", loyaltyError)
      // Don't fail the payment verification if loyalty points fail
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

async function awardLoyaltyPoints(
  sql: any,
  userId: string,
  orderAmount: number,
  orderId: string | number,
  orderNumber: string | number,
) {
  // Calculate points: 2% of order amount (1 point per ₹50)
  const pointsEarned = Math.round(orderAmount * 0.02)
  if (pointsEarned <= 0) return

  // Normalize types to help Postgres infer correctly (loyalty_transactions.order_id is VARCHAR)
  const orderIdStr = String(orderId)
  const description = `Points earned from order #${orderNumber}`

  // Get or create loyalty record
  const loyaltyRecord = await sql`
    SELECT * FROM loyalty_points WHERE user_id = ${String(userId)}
  `

  if (loyaltyRecord.length === 0) {
    await sql`
      INSERT INTO loyalty_points (user_id, current_points, total_earned, tier)
      VALUES (${String(userId)}, ${pointsEarned}, ${pointsEarned}, 'Bronze')
    `
  } else {
    const newCurrentPoints = Number(loyaltyRecord[0].current_points || 0) + pointsEarned
    const newTotalEarned = Number(loyaltyRecord[0].total_earned || 0) + pointsEarned

    let newTier = "Bronze"
    if (newTotalEarned >= 5000) newTier = "Platinum"
    else if (newTotalEarned >= 2500) newTier = "Gold"
    else if (newTotalEarned >= 1000) newTier = "Silver"

    await sql`
      UPDATE loyalty_points 
      SET current_points = ${newCurrentPoints},
          total_earned = ${newTotalEarned},
          tier = ${newTier},
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${String(userId)}
    `
  }

  // Use only parameters (no string interpolation inside SQL), cast order_id explicitly to text context
  await sql`
    INSERT INTO loyalty_transactions (user_id, type, points, description, order_id)
    VALUES (${String(userId)}, 'earned', ${pointsEarned}, ${description}, ${orderIdStr})
  `

  console.log("[v0] Awarded loyalty points:", {
    userId: String(userId),
    pointsEarned,
    orderId: orderIdStr,
    orderNumber: String(orderNumber),
  })
}
