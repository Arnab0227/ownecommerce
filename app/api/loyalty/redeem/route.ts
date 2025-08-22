import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { userId, rewardId, pointsRequired } = await request.json()

    // Get current loyalty points
    const loyalty = await sql`
      SELECT * FROM loyalty_points WHERE user_id = ${userId}
    `

    if (loyalty.length === 0 || loyalty[0].points < pointsRequired) {
      return NextResponse.json({ error: "Insufficient points" }, { status: 400 })
    }

    // Get reward details
    const reward = await sql`
      SELECT * FROM loyalty_rewards WHERE id = ${rewardId}
    `

    if (reward.length === 0) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 })
    }

    // Deduct points
    await sql`
      UPDATE loyalty_points 
      SET points = points - ${pointsRequired}
      WHERE user_id = ${userId}
    `

    // Record transaction
    await sql`
      INSERT INTO loyalty_transactions (
        user_id, type, points, description, created_at
      ) VALUES (
        ${userId}, 'redeemed', ${-pointsRequired}, 
        ${"Redeemed: " + reward[0].name}, NOW()
      )
    `

    // Create coupon or reward record
    if (reward[0].type === "discount") {
      await sql`
        INSERT INTO user_coupons (
          user_id, code, discount_percentage, expires_at, created_at
        ) VALUES (
          ${userId}, 
          ${"LOYALTY" + Date.now()}, 
          ${reward[0].value}, 
          ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}, 
          NOW()
        )
      `
    }

    return NextResponse.json({
      success: true,
      message: `${reward[0].name} has been added to your account!`,
    })
  } catch (error) {
    console.error("Error redeeming reward:", error)
    return NextResponse.json({ error: "Failed to redeem reward" }, { status: 500 })
  }
}
