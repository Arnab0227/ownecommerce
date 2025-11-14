import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json([])
    }

    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection")
    const limit = searchParams.get("limit") || "8"

    if (!collection) {
      return NextResponse.json({ error: "Collection parameter required" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL)

    const products = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.original_price,
        p.category,
        p.stock_quantity,
        p.image_url,
        p.sku,
        p.rating,
        p.featured_collections
      FROM products p
      WHERE 
        p.is_active = true
        AND p.featured_collections::text LIKE ${"%" + collection + "%"}
      ORDER BY p.created_at DESC
      LIMIT ${Number.parseInt(limit)}
    `

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products by collection:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}
