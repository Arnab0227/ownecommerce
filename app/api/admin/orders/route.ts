import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const timeRange = searchParams.get("timeRange")

    const whereConditions: string[] = []
    const params: any[] = []

    // Apply status filter
    if (status && status !== "all") {
      whereConditions.push(`o.status = $${params.length + 1}`)
      params.push(status)
    }

    // Apply time range filter
    if (timeRange && timeRange !== "all") {
      let timeFilter = ""
      switch (timeRange) {
        case "today":
          timeFilter = "o.created_at >= CURRENT_DATE"
          break
        case "week":
          timeFilter = "o.created_at >= CURRENT_DATE - INTERVAL '7 days'"
          break
        case "month":
          timeFilter = "o.created_at >= CURRENT_DATE - INTERVAL '30 days'"
          break
        case "year":
          timeFilter = "o.created_at >= CURRENT_DATE - INTERVAL '365 days'"
          break
      }
      if (timeFilter) {
        whereConditions.push(timeFilter)
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    const orders = await sql`
      SELECT 
        o.id,
        o.order_number,
        o.user_id,
        COALESCE(u.email, o.email) as user_email,
        u.name as customer_name,
        o.created_at,
        o.updated_at,
        o.status,
        o.total_amount,
        o.delivery_fee,
        o.payment_method,
        o.payment_status,
        o.tracking_number,
        o.razorpay_order_id,
        o.razorpay_payment_id,
        o.razorpay_signature,
        o.user_notes,
        o.admin_notes,
        COALESCE(o.shipping_address->>'name', a.name) as shipping_name,
        COALESCE(o.shipping_address->>'address', a.street) as address,
        COALESCE(o.shipping_address->>'city', a.city) as city,
        COALESCE(o.shipping_address->>'state', a.state) as state,
        COALESCE(o.shipping_address->>'pincode', a.pincode) as pincode,
        COALESCE(o.shipping_address->>'phone', a.phone) as shipping_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id::text = u.id::text
      LEFT JOIN user_addresses a ON o.address_id = a.id
      ${whereClause ? sql.unsafe(whereClause) : sql``}
      ORDER BY o.created_at DESC
    `

    const orderIds = orders.map((order) => order.id)
    let orderItems: any[] = []

    if (orderIds.length > 0) {
      orderItems = await sql`
        SELECT 
          oi.order_id,
          oi.product_id,
          oi.quantity,
          oi.price,
          (oi.quantity * oi.price) as total,
          p.name as product_name,
          p.image_url as product_image
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ANY(${orderIds})
      `
    }

    const itemsMap = new Map<number, any[]>()
    orderItems.forEach((item: any) => {
      if (!itemsMap.has(item.order_id)) {
        itemsMap.set(item.order_id, [])
      }
      itemsMap.get(item.order_id)!.push({
        id: `${item.order_id}-${item.product_id}`,
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image || "/placeholder.svg?height=60&width=60",
        price: Number(item.price),
        quantity: Number(item.quantity),
        total: Number(item.total),
      })
    })

    const ordersWithItems = orders.map((order: any) => ({
      id: order.id.toString(),
      user_id: order.user_id,
      user_email: order.user_email || null,
      total_amount: Number(order.total_amount),
      status: order.status,
      payment_method: order.payment_method || "cod",
      payment_status: order.payment_status || "pending",
      razorpay_order_id: order.razorpay_order_id,
      razorpay_payment_id: order.razorpay_payment_id,
      razorpay_signature: order.razorpay_signature,
      delivery_fee: order.delivery_fee !== null ? Number(order.delivery_fee) : 0,
      user_notes: order.user_notes || null,
      admin_notes: order.admin_notes || null,
      shipping_address: {
        name: order.shipping_name || "",
        phone: order.shipping_phone || "",
        address: order.address || "",
        city: order.city || "",
        state: order.state || "",
        pincode: order.pincode || "",
      },
      created_at: order.created_at,
      updated_at: order.updated_at || order.created_at,
      items: itemsMap.get(order.id) || [],
    }))

    return NextResponse.json(ordersWithItems)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status } = body

    await sql`
      UPDATE orders 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${orderId}
    `

    // Send notification to customer about status change
    try {
      const order = await sql`
        SELECT o.*, u.email, u.name 
        FROM orders o
        LEFT JOIN users u ON o.user_id::text = u.id::text
        WHERE o.id = ${orderId}
      `

      if (order.length > 0) {
        // Send email notification
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: order[0].email,
            subject: `Order ${order[0].order_number} Status Update`,
            template: "order-status-update",
            data: {
              customerName: order[0].name,
              orderNumber: order[0].order_number,
              status: status,
              trackingNumber: order[0].tracking_number,
            },
          }),
        })
      }
    } catch (notificationError) {
      console.log("Notification failed:", notificationError)
    }

    return NextResponse.json({ success: true, message: "Order status updated" })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
