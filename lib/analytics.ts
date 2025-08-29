import { neon } from "@neondatabase/serverless"
import { verifyIdToken } from "./firebase-admin"

const sql = neon(process.env.DATABASE_URL!)

export interface ProductView {
  id: number
  product_id: number
  user_id?: string
  session_id: string
  ip_address?: string
  user_agent?: string
  referrer?: string
  viewed_at: Date
}

export interface TrendingProduct {
  product_id: number
  name: string
  category: string
  view_count: number
  unique_viewers: number
  trend_score: number
  price: number
  image_url?: string
}

export interface AnalyticsDashboard {
  totalViews: number
  uniqueViewers: number
  topProducts: TrendingProduct[]
  categoryPerformance: CategoryPerformance[]
  viewsOverTime: ViewsOverTime[]
  growthMetrics: GrowthMetrics
}

export interface CategoryPerformance {
  category: string
  view_count: number
  unique_viewers: number
  conversion_rate: number
}

export interface ViewsOverTime {
  date: string
  views: number
  unique_viewers: number
}

export interface GrowthMetrics {
  viewsGrowth: number
  uniqueViewersGrowth: number
  topGrowingProduct: string
  topGrowingCategory: string
}

// Track a product view
export async function trackProductView(data: {
  product_id: number
  authorization?: string
  ip_address?: string
  user_agent?: string
  referrer?: string
  view_duration?: number
}): Promise<boolean> {
  try {
    let userId: string | null = null

    // If authorization header is provided, verify it and get user ID
    if (data.authorization) {
      try {
        const token = data.authorization.replace("Bearer ", "")
        const decodedToken = await verifyIdToken(token)
        userId = decodedToken.uid
      } catch (error) {
        console.warn("Failed to verify auth token:", error)
        // Continue without user ID
      }
    }

    // Generate session ID if not provided
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await sql`
      INSERT INTO product_views (
        product_id, 
        user_id, 
        session_id, 
        ip_address, 
        user_agent, 
        referrer,
        viewed_at
      ) VALUES (
        ${data.product_id},
        ${userId},
        ${sessionId},
        ${data.ip_address || null},
        ${data.user_agent || null},
        ${data.referrer || null},
        NOW()
      )
    `

    return true
  } catch (error) {
    console.error("Error tracking product view:", error)
    return false
  }
}

// Get trending products
export async function getTrendingProducts(
  period: "daily" | "weekly" | "monthly" = "weekly",
  limit = 10,
): Promise<TrendingProduct[]> {
  try {
    let timeCondition: string

    switch (period) {
      case "daily":
        timeCondition = "pv.viewed_at >= NOW() - INTERVAL '1 day'"
        break
      case "weekly":
        timeCondition = "pv.viewed_at >= NOW() - INTERVAL '7 days'"
        break
      case "monthly":
        timeCondition = "pv.viewed_at >= NOW() - INTERVAL '30 days'"
        break
      default:
        timeCondition = "pv.viewed_at >= NOW() - INTERVAL '7 days'"
    }

    const results = await sql`
      SELECT 
        p.id as product_id,
        p.name,
        p.category,
        COUNT(pv.id) as view_count,
        COUNT(DISTINCT COALESCE(pv.user_id, pv.session_id)) as unique_viewers,
        (COUNT(pv.id) * 0.7 + COUNT(DISTINCT COALESCE(pv.user_id, pv.session_id)) * 0.3) as trend_score,
        p.price,
        p.image_url
      FROM products p
      LEFT JOIN product_views pv ON p.id = pv.product_id AND ${timeCondition}
      GROUP BY p.id, p.name, p.category, p.price, p.image_url
      HAVING COUNT(pv.id) > 0
      ORDER BY trend_score DESC
      LIMIT ${limit}
    `

    return results.map((row) => ({
      product_id: row.product_id,
      name: row.name,
      category: row.category,
      view_count: Number(row.view_count),
      unique_viewers: Number(row.unique_viewers),
      trend_score: Number(row.trend_score),
      price: Number(row.price),
      image_url: row.image_url,
    }))
  } catch (error) {
    console.error("Error getting trending products:", error)
    return []
  }
}

// Get analytics dashboard data
export async function getAnalyticsDashboard(
  period: "daily" | "weekly" | "monthly" = "weekly",
): Promise<AnalyticsDashboard> {
  try {
    let timeCondition: string
    let previousTimeCondition: string

    switch (period) {
      case "daily":
        timeCondition = "pv.viewed_at >= NOW() - INTERVAL '1 day'"
        previousTimeCondition = "pv.viewed_at >= NOW() - INTERVAL '2 days' AND pv.viewed_at < NOW() - INTERVAL '1 day'"
        break
      case "weekly":
        timeCondition = "pv.viewed_at >= NOW() - INTERVAL '7 days'"
        previousTimeCondition =
          "pv.viewed_at >= NOW() - INTERVAL '14 days' AND pv.viewed_at < NOW() - INTERVAL '7 days'"
        break
      case "monthly":
        timeCondition = "pv.viewed_at >= NOW() - INTERVAL '30 days'"
        previousTimeCondition =
          "pv.viewed_at >= NOW() - INTERVAL '60 days' AND pv.viewed_at < NOW() - INTERVAL '30 days'"
        break
      default:
        timeCondition = "pv.viewed_at >= NOW() - INTERVAL '7 days'"
        previousTimeCondition =
          "pv.viewed_at >= NOW() - INTERVAL '14 days' AND pv.viewed_at < NOW() - INTERVAL '7 days'"
    }

    // Get total views and unique viewers
    const totalStatsResult = await sql`
      SELECT 
        COUNT(pv.id) as total_views,
        COUNT(DISTINCT COALESCE(pv.user_id, pv.session_id)) as unique_viewers
      FROM product_views pv
      WHERE ${timeCondition}
    `

    const totalStats = totalStatsResult[0] || { total_views: 0, unique_viewers: 0 }

    // Get previous period stats for growth calculation
    const previousStatsResult = await sql`
      SELECT 
        COUNT(pv.id) as total_views,
        COUNT(DISTINCT COALESCE(pv.user_id, pv.session_id)) as unique_viewers
      FROM product_views pv
      WHERE ${previousTimeCondition}
    `

    const previousStats = previousStatsResult[0] || { total_views: 0, unique_viewers: 0 }

    // Get top products
    const topProducts = await getTrendingProducts(period, 5)

    // Get category performance
    const categoryPerformance = await sql`
      SELECT 
        p.category,
        COUNT(pv.id) as view_count,
        COUNT(DISTINCT COALESCE(pv.user_id, pv.session_id)) as unique_viewers,
        0 as conversion_rate
      FROM products p
      LEFT JOIN product_views pv ON p.id = pv.product_id AND ${timeCondition}
      GROUP BY p.category
      HAVING COUNT(pv.id) > 0
      ORDER BY view_count DESC
    `

    // Get views over time
    const viewsOverTime = await sql`
      SELECT 
        DATE(pv.viewed_at) as date,
        COUNT(pv.id) as views,
        COUNT(DISTINCT COALESCE(pv.user_id, pv.session_id)) as unique_viewers
      FROM product_views pv
      WHERE ${timeCondition}
      GROUP BY DATE(pv.viewed_at)
      ORDER BY date ASC
    `

    // Calculate growth metrics
    const viewsGrowth =
      Number(previousStats.total_views) > 0
        ? ((Number(totalStats.total_views) - Number(previousStats.total_views)) / Number(previousStats.total_views)) *
          100
        : 0

    const uniqueViewersGrowth =
      Number(previousStats.unique_viewers) > 0
        ? ((Number(totalStats.unique_viewers) - Number(previousStats.unique_viewers)) /
            Number(previousStats.unique_viewers)) *
          100
        : 0

    return {
      totalViews: Number(totalStats.total_views),
      uniqueViewers: Number(totalStats.unique_viewers),
      topProducts,
      categoryPerformance: categoryPerformance.map((row) => ({
        category: row.category,
        view_count: Number(row.view_count),
        unique_viewers: Number(row.unique_viewers),
        conversion_rate: Number(row.conversion_rate),
      })),
      viewsOverTime: viewsOverTime.map((row) => ({
        date: row.date,
        views: Number(row.views),
        unique_viewers: Number(row.unique_viewers),
      })),
      growthMetrics: {
        viewsGrowth,
        uniqueViewersGrowth,
        topGrowingProduct: topProducts[0]?.name || "N/A",
        topGrowingCategory: categoryPerformance[0]?.category || "N/A",
      },
    }
  } catch (error) {
    console.error("Error getting analytics dashboard:", error)
    // Return empty data structure instead of throwing
    return {
      totalViews: 0,
      uniqueViewers: 0,
      topProducts: [],
      categoryPerformance: [],
      viewsOverTime: [],
      growthMetrics: {
        viewsGrowth: 0,
        uniqueViewersGrowth: 0,
        topGrowingProduct: "N/A",
        topGrowingCategory: "N/A",
      },
    }
  }
}

export const getAnalyticsData = getAnalyticsDashboard

// Generate email report data
export async function generateEmailReportData(): Promise<{
  period: string
  totalViews: number
  uniqueViewers: number
  topProducts: TrendingProduct[]
  growthMetrics: GrowthMetrics
}> {
  try {
    const dashboard = await getAnalyticsDashboard("weekly")

    return {
      period: "Weekly",
      totalViews: dashboard.totalViews,
      uniqueViewers: dashboard.uniqueViewers,
      topProducts: dashboard.topProducts.slice(0, 3),
      growthMetrics: dashboard.growthMetrics,
    }
  } catch (error) {
    console.error("Error generating email report data:", error)
    throw error
  }
}

// Clean old analytics data (for maintenance)
export async function cleanOldAnalyticsData(daysToKeep = 90): Promise<void> {
  try {
    await sql`
      DELETE FROM product_views 
      WHERE viewed_at < NOW() - INTERVAL '${daysToKeep} days'
    `
  } catch (error) {
    console.error("Error cleaning old analytics data:", error)
    throw error
  }
}
