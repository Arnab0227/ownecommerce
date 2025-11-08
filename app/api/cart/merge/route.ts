import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { userId, guestItems } = await request.json()

    if (!userId || !guestItems || !Array.isArray(guestItems)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    console.log("[v0] Merging cart for user:", userId, "items:", guestItems.length)

    // Get existing cart items for the user
    const existingCart = await sql`
      SELECT product_id, quantity 
      FROM cart 
      WHERE user_id = ${userId}
    `

    // Create a map of existing items
    const existingItemsMap = new Map(existingCart.map((item: any) => [item.product_id.toString(), item.quantity]))

    // Merge guest items with existing cart
    for (const item of guestItems) {
      const productId = Number.parseInt(item.id)
      const quantity = item.quantity

      if (existingItemsMap.has(item.id)) {
        // Update quantity if item already exists
        const newQuantity = existingItemsMap.get(item.id) + quantity
        await sql`
          UPDATE cart 
          SET quantity = ${newQuantity}, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${userId} AND product_id = ${productId}
        `
      } else {
        // Insert new item
        await sql`
          INSERT INTO cart (user_id, product_id, quantity)
          VALUES (${userId}, ${productId}, ${quantity})
        `
      }
    }

    return NextResponse.json({ message: "Cart merged successfully" })
  } catch (error) {
    console.error("Error merging cart:", error)
    return NextResponse.json({ error: "Failed to merge cart" }, { status: 500 })
  }
}
