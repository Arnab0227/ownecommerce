import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: false, products: [] })
    }

    const sql = neon(process.env.DATABASE_URL)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = Number.parseInt(searchParams.get("limit") || "5")

    // Fetch products from completed orders for logged-in users
    if (userId) {
      const products = await sql`
        SELECT DISTINCT 
          p.id,
          p.name,
          p.price,
          p.original_price,
          p.image_url,
          p.category,
          oi.created_at as purchased_at
        FROM products p
        JOIN order_items oi ON p.id = oi.product_id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.user_id = ${userId} 
          AND o.payment_status = 'paid'
          AND o.status IN ('delivered', 'completed')
        ORDER BY oi.created_at DESC
        LIMIT ${limit}
      `

      return NextResponse.json({
        success: true,
        products: products.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          original_price: p.original_price,
          imageUrl: p.image_url,
          category: p.category,
          purchasedAt: p.purchased_at,
        })),
      })
    }

    return NextResponse.json({ success: true, products: [] })
  } catch (error) {
    console.error("[v0] Error fetching buy it again products:", error)
    return NextResponse.json({ success: false, products: [] })
  }
}
