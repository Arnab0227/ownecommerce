import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const { orderId } = params

    // Get order details with customer info
    const [order] = await sql`
      SELECT 
        o.*,
        u.email,
        u.name as customer_name,
        u.phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ${orderId} AND o.status = 'delivered'
    `

    if (!order) {
      return NextResponse.json({ error: "Order not found or not delivered" }, { status: 404 })
    }

    // Get order items
    const orderItems = await sql`
      SELECT 
        oi.*,
        p.name as product_name,
        p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ${orderId}
    `

    // Generate invoice data
    const invoiceData = {
      invoiceNumber: `INV-${order.id.toString().padStart(6, "0")}`,
      orderNumber: order.id,
      date: new Date(order.created_at).toLocaleDateString("en-IN"),
      dueDate: new Date(order.delivered_at || order.updated_at).toLocaleDateString("en-IN"),
      customer: {
        name: order.customer_name || "Customer",
        email: order.email,
        phone: order.phone,
        address: order.shipping_address,
      },
      items: orderItems.map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: Number.parseFloat(item.price),
        total: Number.parseFloat(item.price) * item.quantity,
      })),
      subtotal: Number.parseFloat(order.total_amount),
      tax: 0, // Add tax calculation if needed
      total: Number.parseFloat(order.total_amount),
      paymentMethod: order.payment_method,
      status: order.status,
    }

    return NextResponse.json(invoiceData)
  } catch (error) {
    console.error("Invoice generation error:", error)
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 })
  }
}
