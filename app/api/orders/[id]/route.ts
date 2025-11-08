import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params
    const body = await request.json()

    console.log("[v0] Updating order:", orderId, "with data:", body)

    const currentOrder = await sql`
      SELECT status, payment_status, user_id, total_amount, order_number FROM orders WHERE id = ${orderId}
    `
    if (currentOrder.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    const oldStatus = currentOrder[0].status

    if (body.status === "shipped") {
      if (!body.tracking_number || String(body.tracking_number).trim() === "") {
        return NextResponse.json({ error: "Tracking number is required to mark order as shipped" }, { status: 400 })
      }
      if (!body.tracking_url || String(body.tracking_url).trim() === "") {
        return NextResponse.json(
          { error: "Tracking website link is required to mark order as shipped" },
          { status: 400 },
        )
      }
    }

    const updateFields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (body.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`)
      values.push(body.status)
      paramIndex++
    }
    if (body.payment_status !== undefined) {
      updateFields.push(`payment_status = $${paramIndex}`)
      values.push(body.payment_status)
      paramIndex++
    }
    if (body.razorpay_payment_id !== undefined) {
      updateFields.push(`razorpay_payment_id = $${paramIndex}`)
      values.push(body.razorpay_payment_id)
      paramIndex++
    }
    if (body.razorpay_signature !== undefined) {
      updateFields.push(`razorpay_signature = $${paramIndex}`)
      values.push(body.razorpay_signature)
      paramIndex++
    }
    if (body.tracking_number !== undefined) {
      updateFields.push(`tracking_number = $${paramIndex}`)
      values.push(body.tracking_number)
      paramIndex++
    }
    if (body.tracking_url !== undefined) {
      updateFields.push(`tracking_url = $${paramIndex}`)
      values.push(body.tracking_url)
      paramIndex++
    }
    if (body.admin_notes !== undefined) {
      updateFields.push(`admin_notes = $${paramIndex}`)
      values.push(body.admin_notes)
      paramIndex++
    }
    if (body.user_notes !== undefined) {
      updateFields.push(`user_notes = $${paramIndex}`)
      values.push(body.user_notes)
      paramIndex++
    }
    if (body.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex}`)
      values.push(body.notes)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    updateFields.push(`updated_at = NOW()`)
    values.push(orderId)

    const updateQuery = `
      UPDATE orders 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `
    console.log("[v0] Update query:", updateQuery)
    console.log("[v0] Update values:", values)

    const result = await sql.query(updateQuery, values)
    const updatedOrder = result[0]

    const orderItems = await sql`
      SELECT product_id, quantity FROM order_items WHERE order_id = ${orderId}
    `

    for (const item of orderItems) {
      if (body.status === "confirmed" && oldStatus !== "confirmed") {
        await sql`
          UPDATE products
          SET stock_quantity = GREATEST(0, stock_quantity - ${item.quantity})
          WHERE id = ${item.product_id}
        `
      } else if (body.status === "cancelled" && oldStatus === "confirmed") {
        await sql`
          UPDATE products
          SET stock_quantity = stock_quantity + ${item.quantity}
          WHERE id = ${item.product_id}
        `
        console.log(`[v0] Restored ${item.quantity} units to product ${item.product_id} due to order cancellation`)
      }
    }

    if (body.status === "confirmed" && oldStatus !== "confirmed") {
      try {
        await awardLoyaltyPoints(
          sql,
          currentOrder[0].user_id,
          currentOrder[0].total_amount,
          orderId,
          currentOrder[0].order_number,
        )
      } catch (loyaltyError) {
        console.error("Failed to award loyalty points:", loyaltyError)
        // Don't fail the order update if loyalty points fail
      }
    }

    if (body.send_notification) {
      try {
        await sendOrderNotification(updatedOrder, body.status || oldStatus, body.tracking_url)
      } catch (notificationError) {
        console.error("[v0] Failed to send notification:", notificationError)
      }
    }

    console.log("[v0] Order updated successfully:", updatedOrder)
    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error) {
    console.error("[v0] Error updating order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params

    const result = await sql`
      SELECT o.*, 
             oi.product_id, oi.quantity, oi.price as item_price, oi.total as item_total,
             p.name as product_name, p.image_url as product_image
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ${orderId}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Group order items
    const order = {
      ...result[0],
      items: result.map((row) => ({
        product_id: row.product_id,
        product_name: row.product_name,
        product_image: row.product_image,
        quantity: row.quantity,
        price: row.item_price,
        total: row.item_total,
      })),
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("[v0] Error fetching order:", error)
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
  }
}

async function sendOrderNotification(order: any, status: string, trackingUrl?: string) {
  try {
    const notificationData = {
      orderId: order.id,
      userEmail: order.user_email || order.email,
      status: status,
      trackingNumber: order.tracking_number,
      trackingUrl: trackingUrl,
      totalAmount: order.total_amount,
    }
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

    const emailResponse = await fetch(`${baseUrl}/api/notifications/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "order_status_update",
        data: notificationData,
      }),
    })
    if (!emailResponse.ok) {
      console.error("[v0] Email notification failed:", await emailResponse.text())
    }

    if (order.shipping_address?.phone) {
      const whatsappResponse = await fetch(`${baseUrl}/api/notifications/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "order_status_update",
          phone: order.shipping_address.phone,
          data: notificationData,
        }),
      })
      if (!whatsappResponse.ok) {
        console.error("[v0] WhatsApp notification failed:", await whatsappResponse.text())
      }
    }
  } catch (error) {
    console.error("[v0] Notification error:", error)
    throw error
  }
}

async function awardLoyaltyPoints(sql: any, userId: string, orderAmount: number, orderId: string, orderNumber: string) {
  // Calculate points: 2% of order amount (1 point per ₹50)
  const pointsEarned = Math.round(orderAmount * 0.02)

  if (pointsEarned <= 0) return

  // Get or create loyalty record
  const loyaltyRecord = await sql`
    SELECT * FROM loyalty_points WHERE user_id = ${userId}
  `

  if (loyaltyRecord.length === 0) {
    // Create new loyalty record
    await sql`
      INSERT INTO loyalty_points (user_id, current_points, total_earned, tier)
      VALUES (${userId}, ${pointsEarned}, ${pointsEarned}, 'Bronze')
    `
  } else {
    // Update existing record
    const newCurrentPoints = loyaltyRecord[0].current_points + pointsEarned
    const newTotalEarned = loyaltyRecord[0].total_earned + pointsEarned

    // Determine new tier based on total earned
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
      WHERE user_id = ${userId}
    `
  }

  // Create transaction record
  await sql`
    INSERT INTO loyalty_transactions (user_id, type, points, description, order_id)
    VALUES (${userId}, 'earned', ${pointsEarned}, 'Points earned from order #${orderNumber}', ${orderId})
  `

  console.log(`[v0] Awarded ${pointsEarned} loyalty points to user ${userId} for order ${orderNumber}`)
}
