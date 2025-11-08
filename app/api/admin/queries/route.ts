import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdmin } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Fetching contact queries...")

    const adminCheck = await requireAdmin(request)
    if (adminCheck instanceof NextResponse) {
      return adminCheck
    }

    // Get all contact queries with user information
    const queries = await sql`
      SELECT 
        cq.id,
        cq.user_id,
        cq.name,
        cq.email,
        cq.phone,
        cq.subject,
        cq.message,
        cq.status,
        cq.created_at,
        cq.updated_at,
        u.name as user_name,
        u.email as user_email
      FROM contact_queries cq
      LEFT JOIN users u ON cq.user_id = u.firebase_uid
      ORDER BY cq.created_at DESC
    `

    console.log("[v0] Found", queries.length, "contact queries")

    const formattedQueries = queries.map((query) => ({
      id: String(query.id),
      user_id: query.user_id,
      name: query.name,
      email: query.email,
      phone: query.phone || "",
      subject: query.subject,
      message: query.message,
      status: query.status || "new",
      created_at: query.created_at,
      updated_at: query.updated_at,
      user_name: query.user_name,
      user_email: query.user_email,
    }))

    return NextResponse.json({ queries: formattedQueries })
  } catch (error) {
    console.error("[v0] Error fetching contact queries:", error)
    return NextResponse.json({ error: "Failed to fetch contact queries", details: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    if (adminCheck instanceof NextResponse) {
      return adminCheck
    }

    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields: id and status" }, { status: 400 })
    }

    await sql`
      UPDATE contact_queries 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true, message: "Query status updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating query status:", error)
    return NextResponse.json({ error: "Failed to update query status" }, { status: 500 })
  }
}
