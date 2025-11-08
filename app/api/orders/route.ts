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
          order_number,
          user_id,
          email,
          total_amount,
          delivery_fee,
          shipping_address,
          billing_address,
          payment_method,
          payment_status,
          status as order_status,  -- map status to order_status for frontend consistency
          tracking_number,
          user_notes,
          admin_notes,
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
          order_number,
          user_id,
          email,
          total_amount,
          delivery_fee,
          shipping_address,
          billing_address,
          payment_method,
          payment_status,
          status as order_status,  -- map status to order_status for frontend consistency
          tracking_number,
          user_notes,
          admin_notes,
          razorpay_order_id,
          razorpay_payment_id,
          created_at,
          updated_at
        FROM orders 
        ORDER BY created_at DESC
      `
    }

    console.log("[v0] Orders query result:", orders) // Debug log
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
      user_notes,
      admin_notes,
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

    const today = new Date()
    const year = today.getFullYear().toString().slice(-2)
    const month = (today.getMonth() + 1).toString().padStart(2, "0")
    const day = today.getDate().toString().padStart(2, "0")
    const randomNum = Math.floor(Math.random() * 999) + 1
    const orderNumber = `ORD${year}${month}${day}${randomNum.toString().padStart(3, "0")}`

    const calculatedDeliveryFee = total_amount >= 699 ? 0 : 70
    const finalDeliveryFee = delivery_fee || calculatedDeliveryFee

    const orderResult = await sql`
      INSERT INTO orders (
        order_number,
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
        created_at,
        updated_at
      )
      VALUES (
        ${orderNumber},
        ${user_id}, 
        ${user_email || null}, 
        ${total_amount}, 
        ${finalDeliveryFee},
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
        NOW() AT TIME ZONE 'UTC',
        NOW() AT TIME ZONE 'UTC'
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
          total,
          created_at
        )
        VALUES (
          ${order.id}, 
          ${item.product_id}, 
          ${item.quantity}, 
          ${item.price},
          ${item.quantity * item.price},
          NOW() AT TIME ZONE 'UTC'
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

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      await fetch(`${baseUrl}/api/notifications/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "order_confirmation",
          data: {
            orderId: order.id,
            userEmail: user_email,
            status: "pending",
            totalAmount: total_amount,
          },
        }),
      })
      console.log("[v0] Order confirmation email sent for order:", order.id)
    } catch (emailError) {
      console.error("[v0] Failed to send order confirmation email:", emailError)
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error creating order:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ error: "Failed to create order", details: errorMessage }, { status: 500 })
  }
}
