import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    if (!process.env.DATABASE_URL) {
      console.log("No DATABASE_URL found, returning mock loyalty data")
      return NextResponse.json({
        points: 1250,
        tier: "Silver",
        tier_progress: 62.5,
        next_tier_points: 750,
        lifetime_points: 2800,
        redeemable_points: 1250,
      })
    }

    const sql = neon(process.env.DATABASE_URL)

    let loyalty
    try {
      // Get or create loyalty record
      loyalty = await sql`
        SELECT * FROM loyalty_points WHERE user_id = ${userId}
      `

      if (loyalty.length === 0) {
        // Create new loyalty record
        loyalty = await sql`
          INSERT INTO loyalty_points (user_id, points, tier, lifetime_points)
          VALUES (${userId}, 0, 'Bronze', 0)
          RETURNING *
        `
      }
    } catch (dbError) {
      console.error("Database error in loyalty API:", dbError)
      // Return mock data if database fails
      return NextResponse.json({
        points: 1250,
        tier: "Silver",
        tier_progress: 62.5,
        next_tier_points: 750,
        lifetime_points: 2800,
        redeemable_points: 1250,
      })
    }

    const loyaltyData = loyalty[0]

    // Calculate tier progress
    const tierThresholds = {
      Bronze: 0,
      Silver: 1000,
      Gold: 2500,
      Platinum: 5000,
    }

    const currentTierThreshold = tierThresholds[loyaltyData.tier as keyof typeof tierThresholds]
    const nextTierThreshold =
      loyaltyData.tier === "Platinum"
        ? 5000
        : loyaltyData.tier === "Gold"
          ? 5000
          : loyaltyData.tier === "Silver"
            ? 2500
            : 1000

    const tierProgress =
      loyaltyData.tier === "Platinum"
        ? 100
        : ((loyaltyData.lifetime_points - currentTierThreshold) / (nextTierThreshold - currentTierThreshold)) * 100

    const nextTierPoints = loyaltyData.tier === "Platinum" ? 0 : nextTierThreshold - loyaltyData.lifetime_points

    return NextResponse.json({
      points: loyaltyData.points,
      tier: loyaltyData.tier,
      tier_progress: Math.max(0, Math.min(100, tierProgress)),
      next_tier_points: Math.max(0, nextTierPoints),
      lifetime_points: loyaltyData.lifetime_points,
      redeemable_points: loyaltyData.points,
    })
  } catch (error) {
    console.error("Error fetching loyalty data:", error)
    return NextResponse.json({ error: "Failed to fetch loyalty data" }, { status: 500 })
  }
}
