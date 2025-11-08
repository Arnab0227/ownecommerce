import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const rows = await sql`
      SELECT 
        sm.id,
        sm.product_id,
        p.name AS product_name,
        COALESCE(sm.type, sm.movement_type) AS type,
        sm.quantity,
        COALESCE(sm.reason, 'No reason provided') AS reason,
        COALESCE(sm.created_at, sm.date) AS created_at,
        COALESCE(sm.created_by, sm.user_id::text, 'system') AS created_by
      FROM stock_movements sm
      LEFT JOIN products p ON p.id = sm.product_id
      ORDER BY COALESCE(sm.created_at, sm.date) DESC
      LIMIT 100
    `
    const movements = (rows as any[]).map((r) => ({
      id: String(r.id),
      product_id: String(r.product_id),
      product_name: r.product_name,
      type: r.type,
      quantity: Number(r.quantity),
      reason: r.reason,
      created_at: r.created_at,
      created_by: r.created_by,
    }))

    return NextResponse.json({ movements })
  } catch (error) {
    console.error("Error fetching stock movements:", error)
    return NextResponse.json({ movements: [] })
  }
}
