import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import { redis, cacheKeys } from "@/lib/redis"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const products = await sql`
      SELECT * FROM products WHERE id = ${id}
    `

    if (products.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const product = products[0]

    try {
      await redis.increment(cacheKeys.productViews(id))
    } catch (err) {
      console.log("[v0] View tracking failed:", err)
    }

    try {
      const productName = product.name || ""
      fetch("/api/search/prefetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseQuery: productName.split(" ").slice(0, 2).join(" "),
          userId: request.headers.get("x-user-id"),
        }),
      }).catch(() => {})
    } catch (err) {
      console.log("[v0] Prefetch scheduling failed:", err)
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}
