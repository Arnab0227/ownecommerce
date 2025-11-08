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
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Check if user has already reviewed this product
    const existingReview = await sql`
      SELECT id FROM reviews 
      WHERE product_id = ${Number.parseInt(productId)} AND user_id = ${user.uid}
    `

    if (existingReview.length > 0) {
      return NextResponse.json({
        canReview: false,
        hasReviewed: true,
        reason: "You have already reviewed this product",
      })
    }

    // Check if user has purchased this product and it's been delivered
    const deliveredOrder = await sql`
      SELECT DISTINCT o.id, o.delivery_status
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ${user.uid} 
        AND oi.product_id = ${Number.parseInt(productId)}
        AND o.payment_status = 'paid'
        AND (o.delivery_status = 'delivered' OR o.status = 'delivered')
      LIMIT 1
    `

    const canReview = deliveredOrder.length > 0

    return NextResponse.json({
      canReview,
      hasReviewed: false,
      reason: canReview
        ? "You can review this product"
        : "You can only review products that have been delivered to you",
    })
  } catch (error) {
    console.error("Error checking review eligibility:", error)
    return NextResponse.json({ error: "Failed to check eligibility" }, { status: 500 })
  }
}
