import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    // Get order details
    const orderResult = await sql`
      SELECT * FROM orders 
      WHERE id = ${orderId} AND payment_status = 'pending'
    `

    if (orderResult.length === 0) {
      return NextResponse.json({ error: "Order not found or already paid" }, { status: 404 })
    }

    const order = orderResult[0]

    // Check if order is within 20-minute window
    const orderTime = new Date(order.created_at)
    const currentTime = new Date()
    const timeDiff = (currentTime.getTime() - orderTime.getTime()) / (1000 * 60) // in minutes

    if (timeDiff > 20) {
      // Cancel the order if it's past 20 minutes
      await sql`
        UPDATE orders 
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${orderId}
      `

      return NextResponse.json(
        {
          error: "Payment window expired. Order has been cancelled.",
        },
        { status: 400 },
      )
    }

    // Generate new payment link (mock implementation)
    const paymentLink = `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?order_id=${orderId}&retry=true`

    // Send payment reminder notifications
    const notificationData = {
      orderId: order.id,
      userEmail: order.user_email,
      paymentLink: paymentLink,
      timeRemaining: Math.ceil(20 - timeDiff),
    }

    // Send email reminder
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/notifications/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "payment_reminder",
        data: notificationData,
      }),
    })

    // Send WhatsApp reminder if phone available
    if (order.shipping_address?.phone) {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/notifications/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "payment_reminder",
          phone: order.shipping_address.phone,
          data: notificationData,
        }),
      })
    }

    return NextResponse.json({
      success: true,
      paymentLink: paymentLink,
      timeRemaining: Math.ceil(20 - timeDiff),
    })
  } catch (error) {
    console.error("[v0] Payment reminder error:", error)
    return NextResponse.json({ error: "Failed to send payment reminder" }, { status: 500 })
  }
}
