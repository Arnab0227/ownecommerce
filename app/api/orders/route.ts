import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items, total, deliveryAddress, paymentMethod, userId } = body

    // Create order
    const orderResult = await sql`
      INSERT INTO orders (user_id, total_amount, delivery_address, payment_method, status)
      VALUES (${userId}, ${total}, ${JSON.stringify(deliveryAddress)}, ${paymentMethod}, 'pending')
      RETURNING *
    `

    const order = orderResult[0]

    // Create order items
    for (const item of items) {
      await sql`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (${order.id}, ${item.id}, ${item.quantity}, ${item.price})
      `
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
