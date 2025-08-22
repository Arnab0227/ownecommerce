import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json([])
    }

    const sql = neon(process.env.DATABASE_URL)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    let orders
    if (userId) {
      orders = await sql`
        SELECT 
          id,
          user_id,
          email,
          total_amount,
          shipping_address,
          payment_method,
          payment_status,
          status as order_status,
          razorpay_order_id,
          razorpay_payment_id,
          created_at,
          updated_at
        FROM orders 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `
    } else {
      orders = await sql`
        SELECT 
          id,
          user_id,
          email,
          total_amount,
          shipping_address,
          payment_method,
          payment_status,
          status as order_status,
          razorpay_order_id,
          razorpay_payment_id,
          created_at,
          updated_at
        FROM orders 
        ORDER BY created_at DESC
      `
    }

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)
    const body = await request.json()

    const {
      user_id,
      user_email,
      items,
      total_amount,
      shipping_address,
      payment_method,
      payment_status = "pending",
      razorpay_order_id,
      razorpay_payment_id,
    } = body

    console.log("[v0] Order creation data:", {
      user_id: typeof user_id,
      user_id_value: user_id,
      total_amount,
      payment_method,
    })

    if (!user_id || !items || !total_amount || !shipping_address || !payment_method) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["user_id", "items", "total_amount", "shipping_address", "payment_method"],
        },
        { status: 400 },
      )
    }

    // Create order
    const orderResult = await sql`
      INSERT INTO orders (
        user_id, 
        email, 
        total_amount, 
        shipping_address, 
        payment_method, 
        payment_status,
        status,
        razorpay_order_id,
        razorpay_payment_id,
        created_at
      )
      VALUES (
        ${user_id}, 
        ${user_email || null}, 
        ${total_amount}, 
        ${JSON.stringify(shipping_address)}, 
        ${payment_method}, 
        ${payment_status},
        'pending',
        ${razorpay_order_id || null},
        ${razorpay_payment_id || null},
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `

    const order = orderResult[0]

    // Create order items
    for (const item of items) {
      await sql`
        INSERT INTO order_items (
          order_id, 
          product_id, 
          quantity, 
          price,
          total
        )
        VALUES (
          ${order.id}, 
          ${item.product_id}, 
          ${item.quantity}, 
          ${item.price},
          ${item.quantity * item.price}
        )
      `

      if (payment_status === "paid") {
        await sql`
          UPDATE products 
          SET stock_quantity = GREATEST(0, stock_quantity - ${item.quantity})
          WHERE id = ${item.product_id}
        `
      }
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error creating order:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ error: "Failed to create order", details: errorMessage }, { status: 500 })
  }
}
