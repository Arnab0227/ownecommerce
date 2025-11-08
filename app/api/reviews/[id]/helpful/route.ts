import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyFirebaseToken } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const authResult = await verifyFirebaseToken(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const user = authResult.user!
    const reviewId = Number.parseInt(params.id)

    if (!reviewId) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 })
    }

    // Check if user has already marked this review as helpful
    const existingHelpful = await sql`
      SELECT id FROM review_helpful 
      WHERE review_id = ${reviewId} AND user_id = ${user.uid}
    `

    if (existingHelpful.length > 0) {
      // Remove the helpful mark (toggle)
      await sql`
        DELETE FROM review_helpful 
        WHERE review_id = ${reviewId} AND user_id = ${user.uid}
      `

      // Update helpful count
      await sql`
        UPDATE reviews 
        SET helpful_count = helpful_count - 1 
        WHERE id = ${reviewId}
      `

      return NextResponse.json({ message: "Helpful mark removed" })
    } else {
      // Add helpful mark
      await sql`
        INSERT INTO review_helpful (review_id, user_id)
        VALUES (${reviewId}, ${user.uid})
      `

      // Update helpful count
      await sql`
        UPDATE reviews 
        SET helpful_count = helpful_count + 1 
        WHERE id = ${reviewId}
      `

      return NextResponse.json({ message: "Marked as helpful" })
    }
  } catch (error) {
    console.error("Error updating helpful status:", error)
    return NextResponse.json({ error: "Failed to update helpful status" }, { status: 500 })
  }
}
