import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)
    const userId = params.userId

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const wishlistItems = await sql`
      SELECT 
        w.id as wishlist_id,
        w.created_at as added_at,
        p.id,
        p.name,
        p.description,
        p.price,
        COALESCE(p.original_price, p.price) as original_price,
        p.category,
        COALESCE(p.stock_quantity, 0) as stock,
        p.image_url,
        p.is_featured,
        p.is_active
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ${userId} AND p.is_active = true
      ORDER BY w.created_at DESC
    `

    return NextResponse.json({
      success: true,
      wishlist: wishlistItems,
      count: wishlistItems.length,
    })
  } catch (error) {
    console.error("Error fetching wishlist:", error)
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 })
  }
}
