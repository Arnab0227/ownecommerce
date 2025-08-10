import { type NextRequest, NextResponse } from "next/server"
import { getTrendingProducts } from "@/lib/analytics"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get("period") as "daily" | "weekly" | "monthly") || "weekly"
    const limit = Number(searchParams.get("limit")) || 10

    const trendingProducts = await getTrendingProducts(period, limit)

    return NextResponse.json({
      period,
      products: trendingProducts,
      total: trendingProducts.length,
    })
  } catch (error) {
    console.error("Error getting trending products:", error)
    return NextResponse.json({ error: "Failed to get trending products" }, { status: 500 })
  }
}
