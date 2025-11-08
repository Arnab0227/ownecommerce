import { type NextRequest, NextResponse } from "next/server"
import { getTrendingProducts } from "@/lib/analytics"
import { redis, cacheKeys, cacheTTL } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get("period") as "daily" | "weekly" | "monthly") || "weekly"
    const limit = Number(searchParams.get("limit")) || 10

    const cacheKey = cacheKeys.trendingProducts(period)
    const cached = await redis.get(cacheKey)

    if (cached) {
      console.log(`[v0] Cache hit for trending products (${period})`)
      return NextResponse.json({
        period,
        products: cached,
        total: (cached as any[]).length,
        fromCache: true,
      })
    }

    const trendingProducts = await getTrendingProducts(period, limit)

    await redis.set(cacheKey, trendingProducts, cacheTTL.medium)

    return NextResponse.json({
      period,
      products: trendingProducts,
      total: trendingProducts.length,
      fromCache: false,
    })
  } catch (error) {
    console.error("Error getting trending products:", error)
    return NextResponse.json({ error: "Failed to get trending products" }, { status: 500 })
  }
}
