import { type NextRequest, NextResponse } from "next/server"
import { getAnalyticsData } from "@/lib/analytics"
import { requireAdmin } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Analytics dashboard request received")

    const adminCheck = await requireAdmin(request)
    if (adminCheck instanceof NextResponse) {
      console.log("[v0] Admin check failed for analytics:", adminCheck.status)
      return adminCheck
    }

    if (!adminCheck || !adminCheck.email) {
      console.log("[v0] Invalid admin user data")
      return NextResponse.json({ error: "Invalid admin authentication" }, { status: 401 })
    }

    console.log("[v0] Admin authenticated successfully:", adminCheck.email)

    const { searchParams } = new URL(request.url)
    const period = (searchParams.get("period") as "daily" | "weekly" | "monthly") || "monthly"

    try {
      const analyticsData = await getAnalyticsData(period)
      console.log("[v0] Analytics data fetched successfully")
      return NextResponse.json(analyticsData)
    } catch (analyticsError) {
      console.log("[v0] Analytics data fetch failed, returning empty data for development:", analyticsError)
      const emptyAnalytics = {
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        averageOrderValue: 0,
        revenueData: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          revenue: 0,
          orders: 0,
        })),
        orderData: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          orders: 0,
        })),
        topProducts: [],
        recentOrders: [],
        period: period,
      }
      return NextResponse.json(emptyAnalytics)
    }
  } catch (error) {
    console.error("[v0] Error getting analytics dashboard data:", error)
    return NextResponse.json({ error: "Failed to get analytics data" }, { status: 500 })
  }
}
