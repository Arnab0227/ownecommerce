import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json([])
    }

    const sql = neon(process.env.DATABASE_URL)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || searchParams.get("user_id")

    let orders
    if (userId) {
      orders = await sql`
        SELECT 
          id,
          order_number,            -- expose for UI
          user_id,
          email,
          total_amount,
          delivery_fee,
          shipping_address,
          billing_address,
          payment_method,
          payment_status,
          status as order_status,
          tracking_number,         -- expose for UI
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
          order_number,            -- expose for UI
          user_id,
          email,
          total_amount,
          delivery_fee,
          shipping_address,
          billing_address,
          payment_method,
          payment_status,
          status as order_status,
          tracking_number,         -- expose for UI
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
      delivery_fee = 0,
      user_notes, // notes from customer at checkout
      admin_notes, // not expected at creation, but accept if sent
    } = body

    if (!user_id || !items || !total_amount || !shipping_address || !payment_method) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["user_id", "items", "total_amount", "shipping_address", "payment_method"],
        },
        { status: 400 },
      )
    }

    const orderResult = await sql`
      INSERT INTO orders (
        user_id, 
        email, 
        total_amount, 
        delivery_fee,
        shipping_address, 
        billing_address,
        payment_method, 
        payment_status,
        status,
        razorpay_order_id,
        razorpay_payment_id,
        notes,
        user_notes,
        admin_notes,
        created_at
      )
      VALUES (
        ${user_id}, 
        ${user_email || null}, 
        ${total_amount}, 
        ${delivery_fee},
        ${JSON.stringify(shipping_address)}, 
        ${JSON.stringify(shipping_address)},
        ${payment_method}, 
        ${payment_status},
        'pending',
        ${razorpay_order_id || null},
        ${razorpay_payment_id || null},
        ${user_notes || null},
        ${user_notes || null},
        ${admin_notes || null},
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `
    const order = orderResult[0]

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
