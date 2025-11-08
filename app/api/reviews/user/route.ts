import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyFirebaseToken } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyFirebaseToken(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const user = authResult.user!

    // Get user's reviews
    const reviews = await sql`
      SELECT 
        r.*,
        p.name as product_name,
        p.image_url as product_image,
        COALESCE(
          (SELECT json_agg(ri.image_url) 
           FROM review_images ri 
           WHERE ri.review_id = r.id), 
          '[]'::json
        ) as images
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      WHERE r.user_id = ${user.uid}
      ORDER BY r.created_at DESC
    `

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error("Error fetching user reviews:", error)
    return NextResponse.json({ error: "Failed to fetch user reviews" }, { status: 500 })
  }
}
