import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id
    const body = await request.json()

    console.log("[v0] Updating order:", orderId, "with data:", body)

    const currentOrder = await sql`
      SELECT status, payment_status FROM orders WHERE id = ${orderId}
    `
    if (currentOrder.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    const oldStatus = currentOrder[0].status

    if (body.status === "shipped" && (!body.tracking_number || String(body.tracking_number).trim() === "")) {
      return NextResponse.json({ error: "Tracking number is required to mark order as shipped" }, { status: 400 })
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
      // If order is confirmed and wasn't before, reduce stock
      if (body.status === "confirmed" && oldStatus !== "confirmed") {
        await sql`
          UPDATE products
          SET stock_quantity = GREATEST(0, stock_quantity - ${item.quantity})
          WHERE id = ${item.product_id}
        `
      }
      // If order is cancelled and was confirmed before, restore stock
      else if (body.status === "cancelled" && oldStatus === "confirmed") {
        await sql`
          UPDATE products
          SET stock_quantity = stock_quantity + ${item.quantity}
          WHERE id = ${item.product_id}
        `
      }
    }

    if (body.send_notification) {
      try {
        await sendOrderNotification(updatedOrder, body.status || oldStatus)
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id

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

async function sendOrderNotification(order: any, status: string) {
  try {
    const notificationData = {
      orderId: order.id,
      // fallback to order.email when user_email missing
      userEmail: order.user_email || order.email,
      status: status,
      trackingNumber: order.tracking_number,
      totalAmount: order.total_amount,
    }
    // Send email notification
    const emailResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/notifications/email`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "order_status_update",
          data: notificationData,
        }),
      },
    )

    if (!emailResponse.ok) {
      console.error("[v0] Email notification failed:", await emailResponse.text())
    }

    // Send WhatsApp notification if phone number available
    if (order.shipping_address?.phone) {
      const whatsappResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/notifications/whatsapp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "order_status_update",
            phone: order.shipping_address.phone,
            data: notificationData,
          }),
        },
      )

      if (!whatsappResponse.ok) {
        console.error("[v0] WhatsApp notification failed:", await whatsappResponse.text())
      }
    }
  } catch (error) {
    console.error("[v0] Notification error:", error)
    throw error
  }
}
