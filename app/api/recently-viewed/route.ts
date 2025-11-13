import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { cacheRecentlyViewed, getRecentlyViewed } from "@/lib/cache-helpers"

export async function POST(request: NextRequest) {
  try {
    const { productId, userId, sessionId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    const numericProductId = Number(productId)
    await cacheRecentlyViewed(userId || null, sessionId || null, numericProductId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error adding to recently viewed:", error)
    return NextResponse.json({ error: "Failed to add to recently viewed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const sessionId = searchParams.get("sessionId")
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)

    if (!userId && !sessionId) {
      return NextResponse.json({ error: "User ID or session ID is required" }, { status: 400 })
    }

    if (!process.env.DATABASE_URL) {
      console.log("[v0] No DATABASE_URL found, returning empty array")
      return NextResponse.json({ success: true, products: [] })
    }

    const recentlyViewedIds = await getRecentlyViewed(userId, sessionId)

    if (!recentlyViewedIds || recentlyViewedIds.length === 0) {
      return NextResponse.json({ success: true, products: [] })
    }

    const sql = neon(process.env.DATABASE_URL)

    const ids = (Array.isArray(recentlyViewedIds) ? recentlyViewedIds : []).slice(0, limit).map((id) => Number(id))

    if (ids.length === 0) {
      return NextResponse.json({ success: true, products: [] })
    }

    const placeholders = ids.map((_, index) => `$${index + 1}`).join(",")

    const query = `
      SELECT 
        id,
        name,
        price,
        original_price,
        image_url,
        category,
        created_at
      FROM products 
      WHERE id IN (${placeholders})
    `

    const products = await sql.query(query, ids)

    const sortedProducts = ids
      .map((id) => products.find((p: any) => Number(p.id) === id))
      .filter((p: any) => p !== undefined)

    console.log(
      "[v0] Returning recently viewed products:",
      sortedProducts.map((p: any) => p.id),
    )

    return NextResponse.json({
      success: true,
      products: sortedProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        original_price: p.original_price,
        imageUrl: p.image_url,
        category: p.category,
      })),
    })
  } catch (error) {
    console.error("[v0] Error fetching recently viewed:", error)
    return NextResponse.json({ error: "Failed to fetch recently viewed" }, { status: 500 })
  }
}
