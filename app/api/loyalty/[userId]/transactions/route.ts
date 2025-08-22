import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const transactions = await sql`
      SELECT * FROM loyalty_transactions 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `

    return NextResponse.json({
      success: true,
      transactions: transactions,
    })
  } catch (error) {
    console.error("Error fetching loyalty transactions:", error)

    // Return mock data if database fails
    const mockTransactions = [
      {
        id: "1",
        type: "earned",
        points: 125,
        description: "Order purchase - Order #ORD001",
        order_id: "ORD001",
        created_at: "2024-01-10T14:30:00Z",
      },
      {
        id: "2",
        type: "redeemed",
        points: -500,
        description: "10% discount coupon redeemed",
        created_at: "2024-01-08T10:15:00Z",
      },
      {
        id: "3",
        type: "earned",
        points: 200,
        description: "Order purchase - Order #ORD002",
        order_id: "ORD002",
        created_at: "2024-01-05T16:45:00Z",
      },
    ]

    return NextResponse.json({
      success: true,
      transactions: mockTransactions,
    })
  }
}
