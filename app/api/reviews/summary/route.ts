import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Get review summary
    const summaryResult = await sql`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating)::numeric(3,2) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as rating_5,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as rating_4,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as rating_3,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as rating_2,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as rating_1
      FROM reviews 
      WHERE product_id = ${Number.parseInt(productId)}
    `

    const summary = summaryResult[0]

    return NextResponse.json({
      totalReviews: Number.parseInt(summary.total_reviews),
      averageRating: Number.parseFloat(summary.average_rating) || 0,
      ratingDistribution: {
        5: Number.parseInt(summary.rating_5),
        4: Number.parseInt(summary.rating_4),
        3: Number.parseInt(summary.rating_3),
        2: Number.parseInt(summary.rating_2),
        1: Number.parseInt(summary.rating_1),
      },
    })
  } catch (error) {
    console.error("Error fetching review summary:", error)
    return NextResponse.json({ error: "Failed to fetch review summary" }, { status: 500 })
  }
}
