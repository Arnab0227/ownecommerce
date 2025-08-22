import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Get customers with their order statistics
    const customers = await sql`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.phone,
        u.created_at,
        u.last_login,
        u.status,
        COALESCE(order_stats.total_orders, 0) as total_orders,
        COALESCE(order_stats.total_spent, 0) as total_spent,
        COALESCE(loyalty.points, 0) as loyalty_points
      FROM users u
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(*) as total_orders,
          SUM(total_amount) as total_spent
        FROM orders
        GROUP BY user_id
      ) order_stats ON u.id = order_stats.user_id
      LEFT JOIN loyalty_points loyalty ON u.id = loyalty.user_id
      ORDER BY u.created_at DESC
    `

    // Get addresses for each customer
    const addresses = await sql`
      SELECT 
        user_id,
        street,
        city,
        state,
        pincode,
        is_default
      FROM user_addresses
      ORDER BY is_default DESC
    `

    // Get recent orders for each customer
    const recentOrders = await sql`
      SELECT 
        user_id,
        id,
        total_amount as total,
        status,
        created_at as date
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC
    `

    // Group addresses and orders by user
    const addressMap = new Map()
    const orderMap = new Map()

    addresses.forEach((addr: any) => {
      if (!addressMap.has(addr.user_id)) {
        addressMap.set(addr.user_id, [])
      }
      addressMap.get(addr.user_id).push({
        street: addr.street,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        is_default: addr.is_default,
      })
    })

    recentOrders.forEach((order: any) => {
      if (!orderMap.has(order.user_id)) {
        orderMap.set(order.user_id, [])
      }
      orderMap.get(order.user_id).push({
        id: order.id,
        total: order.total,
        status: order.status,
        date: order.date,
      })
    })

    // Combine data
    const customersWithDetails = customers.map((customer: any) => ({
      ...customer,
      addresses: addressMap.get(customer.id) || [],
      recent_orders: orderMap.get(customer.id) || [],
      status: customer.status || "active",
    }))

    return NextResponse.json(customersWithDetails)
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}
