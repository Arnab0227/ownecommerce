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

    const parsedProductId = Number.parseInt(productId)
    console.log(`[v0] Fetching reviews for productId: ${parsedProductId}`)

    const reviews = await sql`
      SELECT 
        r.id,
        r.product_id,
        r.user_id,
        r.rating,
        r.title,
        r.comment,
        r.is_verified,
        r.helpful_count,
        r.created_at,
        COALESCE(u.name, u.email, 'Anonymous User') as user_name,
        COALESCE(
          (SELECT json_agg(ri.image_url ORDER BY ri.id) 
           FROM review_images ri 
           WHERE ri.review_id = r.id AND ri.image_url IS NOT NULL), 
          '[]'::json
        ) as images
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.firebase_uid
      WHERE r.product_id = ${parsedProductId}
      ${sql.unsafe(orderClause)}
    `

    console.log(
      `[v0] Raw reviews from DB:`,
      reviews.map((r: any) => ({ id: r.id, user_name: r.user_name, user_id: r.user_id, images: r.images })),
    )

    const processedReviews = reviews.map((review: any) => {
      // Parse images array if it exists
      let images: string[] = []
      if (review.images && Array.isArray(review.images)) {
        images = review.images.filter((img: string | null) => img !== null && img.trim() !== "")
      } else if (review.images) {
        try {
          const parsed = JSON.parse(review.images)
          images = Array.isArray(parsed) ? parsed.filter((img: string | null) => img !== null && img.trim() !== "") : []
        } catch {
          images = []
        }
      }

      const userName = review.user_name || "Anonymous User"

      console.log(`[v0] Processed review ${review.id}:`, { user_name: userName, image_count: images.length })

      return {
        ...review,
        images,
        user_name: userName,
      }
    })

    console.log(`[v0] Retrieved ${processedReviews.length} reviews for productId: ${parsedProductId}`)
    console.log(
      `[v0] Review data:`,
      processedReviews.map((r: any) => ({ id: r.id, user_name: r.user_name, images: r.images })),
    )
    return NextResponse.json({ reviews: processedReviews })
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
    console.log(`[v0] Auth user object:`, {
      uid: user.uid,
      email: user.email,
      name: user.name,
      displayName: (user as any).displayName,
    })
    const userName = user.name || (user as any).displayName || user.email?.split("@")[0] || "Anonymous User"
    console.log(`[v0] Extracted userName: "${userName}"`)

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

    const upsertResult = await sql`
      INSERT INTO users (firebase_uid, email, name)
      VALUES (${user.uid}, ${user.email}, ${userName})
      ON CONFLICT (firebase_uid) DO UPDATE SET 
        name = CASE 
          WHEN ${userName} != '' THEN ${userName}
          ELSE users.name
        END,
        email = COALESCE(${user.email}, users.email),
        updated_at = NOW()
      RETURNING firebase_uid, name, email
    `

    console.log(`[v0] User upserted:`, upsertResult[0])

    const reviewResult = await sql`
      INSERT INTO reviews (product_id, user_id, order_id, rating, title, comment, is_verified)
      VALUES (${productId}, ${user.uid}, ${orderId}, ${rating}, ${title}, ${comment}, ${isVerified})
      RETURNING id
    `

    const reviewId = reviewResult[0].id
    console.log(`[v0] Review created with ID: ${reviewId} for productId: ${productId}`)

    // Handle image uploads
    const imageUrls: string[] = []
    const imageEntries = Array.from(formData.entries()).filter(([key]) => key.startsWith("image_"))
    console.log(`[v0] Found ${imageEntries.length} image entries to process`)

    for (const [key, file] of imageEntries) {
      if (file instanceof File && file.size > 0) {
        try {
          const buffer = await file.arrayBuffer()
          const base64 = Buffer.from(buffer).toString("base64")
          const mimeType = file.type || "image/jpeg"
          const imageUrl = `data:${mimeType};base64,${base64}`

          const insertResult = await sql`
            INSERT INTO review_images (review_id, image_url, alt_text)
            VALUES (${reviewId}, ${imageUrl}, ${`Review image for ${title}`})
            RETURNING id
          `
          console.log(`[v0] Added image for review ${reviewId}, image record id: ${insertResult[0].id}`)
          imageUrls.push(imageUrl)
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError)
        }
      }
    }

    const verifyImages = await sql`
      SELECT image_url FROM review_images 
      WHERE review_id = ${reviewId}
    `
    console.log(`[v0] Verified ${verifyImages.length} images stored for review ${reviewId}`)

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
