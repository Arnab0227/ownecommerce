import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyFirebaseToken } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const sortBy = searchParams.get("sortBy") || "newest"

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    let orderClause = "ORDER BY r.created_at DESC"
    switch (sortBy) {
      case "oldest":
        orderClause = "ORDER BY r.created_at ASC"
        break
      case "highest":
        orderClause = "ORDER BY r.rating DESC, r.created_at DESC"
        break
      case "lowest":
        orderClause = "ORDER BY r.rating ASC, r.created_at DESC"
        break
      default:
        orderClause = "ORDER BY r.created_at DESC"
    }

    const reviews = await sql`
      SELECT 
        r.*,
        u.name as user_name,
        COALESCE(
          (SELECT json_agg(ri.image_url) 
           FROM review_images ri 
           WHERE ri.review_id = r.id), 
          '[]'::json
        ) as images
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.firebase_uid
      WHERE r.product_id = ${Number.parseInt(productId)}
      ${sql.unsafe(orderClause)}
    `

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyFirebaseToken(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const user = authResult.user!
    const formData = await request.formData()

    const productId = Number.parseInt(formData.get("productId") as string)
    const rating = Number.parseInt(formData.get("rating") as string)
    const title = formData.get("title") as string
    const comment = formData.get("comment") as string

    // Validate required fields
    if (!productId || !rating || !title || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // Check if user has already reviewed this product
    const existingReview = await sql`
      SELECT id FROM reviews 
      WHERE product_id = ${productId} AND user_id = ${user.uid}
    `

    if (existingReview.length > 0) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 })
    }

    // Check if user has purchased this product
    const purchaseCheck = await sql`
      SELECT DISTINCT o.id as order_id
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ${user.uid} 
        AND oi.product_id = ${productId}
        AND o.payment_status = 'paid'
      LIMIT 1
    `

    const isVerified = purchaseCheck.length > 0
    const orderId = isVerified ? purchaseCheck[0].order_id : null

    // Insert the review
    const reviewResult = await sql`
      INSERT INTO reviews (product_id, user_id, order_id, rating, title, comment, is_verified)
      VALUES (${productId}, ${user.uid}, ${orderId}, ${rating}, ${title}, ${comment}, ${isVerified})
      RETURNING id
    `

    const reviewId = reviewResult[0].id

    // Handle image uploads
    const imageUrls: string[] = []
    const imageEntries = Array.from(formData.entries()).filter(([key]) => key.startsWith("image_"))

    for (const [key, file] of imageEntries) {
      if (file instanceof File && file.size > 0) {
        try {
          // In a real implementation, you would upload to a cloud storage service
          // For now, we'll simulate the upload and store a placeholder URL
          const imageUrl = `/uploads/reviews/${reviewId}/${file.name}`
          imageUrls.push(imageUrl)

          // Insert image record
          await sql`
            INSERT INTO review_images (review_id, image_url, alt_text)
            VALUES (${reviewId}, ${imageUrl}, ${`Review image for ${title}`})
          `
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError)
          // Continue with other images even if one fails
        }
      }
    }

    return NextResponse.json({
      message: "Review submitted successfully",
      reviewId,
      isVerified,
      imageCount: imageUrls.length,
    })
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}
