import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const movements = await sql`
      SELECT 
        id,
        product_id,
        product_name,
        type,
        quantity,
        reason,
        date,
        user_id as user
      FROM stock_movements
      ORDER BY date DESC
      LIMIT 100
    `

    return NextResponse.json(movements)
  } catch (error) {
    console.error("Error fetching stock movements:", error)

    // Return mock data if table doesn't exist
    const mockMovements = [
      {
        id: "1",
        product_id: "1",
        product_name: "Elegant Silk Dress",
        type: "in",
        quantity: 20,
        reason: "New stock arrival",
        date: "2024-01-15T10:00:00Z",
        user: "admin",
      },
      {
        id: "2",
        product_id: "2",
        product_name: "Cotton Kids T-Shirt",
        type: "out",
        quantity: 5,
        reason: "Damaged items removed",
        date: "2024-01-14T14:30:00Z",
        user: "admin",
      },
    ]

    return NextResponse.json(mockMovements)
  }
}
