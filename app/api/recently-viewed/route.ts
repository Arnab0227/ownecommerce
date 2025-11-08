import { type NextRequest, NextResponse } from "next/server"
import { redis, cacheKeys, cacheTTL } from "@/lib/redis"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

interface RecentlyViewedProduct {
  id: string | number
  name: string
  price: number
  original_price?: number
  imageUrl?: string
  category?: string
  viewedAt: number // timestamp
}

// POST - Add product to recently viewed
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, userId, sessionId } = body

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 })
    }

    // Fetch product details
    const products = await sql`
      SELECT id, name, price, original_price, image_url, category
      FROM products
      WHERE id = ${productId}
      LIMIT 1
    `

    if (products.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const product = products[0]
    const viewedProduct: RecentlyViewedProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      original_price: product.original_price,
      imageUrl: product.image_url,
      category: product.category,
      viewedAt: Date.now(),
    }

    // Store in Redis for user or session
    const cacheKey = userId ? cacheKeys.recentlyViewed(userId) : cacheKeys.sessionRecentlyViewed(sessionId)

    // Get existing recently viewed items
    let recentlyViewed = (await redis.get<RecentlyViewedProduct[]>(cacheKey)) || []

    // Remove duplicate if exists and add new one at the beginning
    recentlyViewed = [viewedProduct, ...recentlyViewed.filter((item) => item.id !== productId)].slice(0, 20)

    // Save back to Redis with 30-day TTL for users, 7 days for sessions
    const ttl = userId ? cacheTTL.daily * 30 : cacheTTL.daily * 7
    await redis.set(cacheKey, recentlyViewed, ttl)

    return NextResponse.json({
      success: true,
      recentlyViewed,
    })
  } catch (error) {
    console.error("[v0] Recently viewed POST error:", error)
    return NextResponse.json({ error: "Failed to add to recently viewed" }, { status: 500 })
  }
}

// GET - Retrieve recently viewed products
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const sessionId = searchParams.get("sessionId")
    const limit = Number(searchParams.get("limit")) || 10

    if (!userId && !sessionId) {
      return NextResponse.json({ error: "userId or sessionId is required" }, { status: 400 })
    }

    const cacheKey = userId ? cacheKeys.recentlyViewed(userId) : cacheKeys.sessionRecentlyViewed(sessionId || "")

    const recentlyViewed = (await redis.get<RecentlyViewedProduct[]>(cacheKey)) || []

    return NextResponse.json({
      success: true,
      recentlyViewed: recentlyViewed.slice(0, limit),
      count: recentlyViewed.length,
    })
  } catch (error) {
    console.error("[v0] Recently viewed GET error:", error)
    return NextResponse.json({ error: "Failed to fetch recently viewed" }, { status: 500 })
  }
}

// DELETE - Clear recently viewed
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sessionId, productId } = body

    if (!userId && !sessionId) {
      return NextResponse.json({ error: "userId or sessionId is required" }, { status: 400 })
    }

    const cacheKey = userId ? cacheKeys.recentlyViewed(userId) : cacheKeys.sessionRecentlyViewed(sessionId || "")

    if (productId) {
      // Remove specific product
      const recentlyViewed = (await redis.get<RecentlyViewedProduct[]>(cacheKey)) || []
      const filtered = recentlyViewed.filter((item) => item.id !== productId)
      await redis.set(cacheKey, filtered, cacheTTL.daily * 30)
    } else {
      // Clear all
      await redis.delete(cacheKey)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Recently viewed DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete recently viewed" }, { status: 500 })
  }
}
