import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
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

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)
    const { userId, productId } = await request.json()

    if (!userId || !productId) {
      return NextResponse.json({ error: "Missing userId or productId" }, { status: 400 })
    }

    // Check if item already exists in wishlist
    const existing = await sql`
      SELECT id FROM wishlist 
      WHERE user_id = ${userId} AND product_id = ${productId}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: "Item already in wishlist" }, { status: 409 })
    }

    // Add to wishlist
    const result = await sql`
      INSERT INTO wishlist (user_id, product_id, created_at)
      VALUES (${userId}, ${productId}, CURRENT_TIMESTAMP)
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: "Item added to wishlist",
      wishlistItem: result[0],
    })
  } catch (error) {
    console.error("Error adding to wishlist:", error)
    return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)
    const { userId, productId } = await request.json()

    if (!userId || !productId) {
      return NextResponse.json({ error: "Missing userId or productId" }, { status: 400 })
    }

    // Remove from wishlist
    const result = await sql`
      DELETE FROM wishlist 
      WHERE user_id = ${userId} AND product_id = ${productId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Item not found in wishlist" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Item removed from wishlist",
    })
  } catch (error) {
    console.error("Error removing from wishlist:", error)
    return NextResponse.json({ error: "Failed to remove from wishlist" }, { status: 500 })
  }
}
