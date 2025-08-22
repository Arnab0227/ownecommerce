import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id
    const body = await request.json()

    console.log("[v0] Updating order:", orderId, "with data:", body)

    // Build dynamic update query based on provided fields
    const updateFields = []
    const values = []
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

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`)

    // Add order ID as the last parameter
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

    if (result.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    console.log("[v0] Order updated successfully:", result[0])

    return NextResponse.json({
      success: true,
      order: result[0],
    })
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
