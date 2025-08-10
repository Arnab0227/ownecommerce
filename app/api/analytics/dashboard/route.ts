import { type NextRequest, NextResponse } from "next/server"
import { getAnalyticsData } from "@/lib/analytics"
import { requireAdmin } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin(request)
    if (adminCheck instanceof NextResponse) {
      return adminCheck
    }

    const { searchParams } = new URL(request.url)
    const period = (searchParams.get("period") as "daily" | "weekly" | "monthly") || "monthly"

    const analyticsData = await getAnalyticsData(period)

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error("Error getting analytics dashboard data:", error)
    return NextResponse.json({ error: "Failed to get analytics data" }, { status: 500 })
  }
}
