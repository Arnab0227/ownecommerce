import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
    const sql = neon(process.env.DATABASE_URL)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Try to find user by firebase_uid or numeric id
    const users = await sql`
      SELECT 
        id::text as user_id, 
        name, 
        email
      FROM users 
      WHERE firebase_uid = ${userId} OR id::text = ${userId}
      LIMIT 1
    `

    if (users.length > 0) {
      const u = users[0]
      // Try to find a phone from the latest/default address
      const phones = await sql`
        SELECT phone 
        FROM user_addresses 
        WHERE user_id = ${u.user_id}
        ORDER BY is_default DESC, updated_at DESC 
        LIMIT 1
      `
      return NextResponse.json({
        user_id: u.user_id,
        name: u.name || null,
        email: u.email || null,
        phone: phones[0]?.phone || null,
      })
    }

    // Fallback: derive from latest order with that user_id (orders.user_id is varchar)
    const derived = await sql`
      SELECT 
        user_id,
        COALESCE(shipping_address->>'name', NULL) as name,
        email,
        COALESCE(shipping_address->>'phone', NULL) as phone
      FROM orders
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (derived.length > 0) {
      const d = derived[0]
      return NextResponse.json({
        user_id: d.user_id,
        name: d.name || null,
        email: d.email || null,
        phone: d.phone || null,
      })
    }

    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  } catch (error) {
    console.error("[v0] /api/users/profile error:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}
