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
export async function trackProductView(
  productId: number,
  sessionId: string,
  options: {
    userId?: string
    ipAddress?: string
    userAgent?: string
    referrer?: string
    authToken?: string
  } = {},
): Promise<void> {
  try {
    let userId = options.userId

    // If auth token is provided, verify it and get user ID
    if (options.authToken && !userId) {
      try {
        const decodedToken = await verifyIdToken(options.authToken)
        userId = decodedToken.uid
      } catch (error) {
        console.warn("Failed to verify auth token:", error)
        // Continue without user ID
      }
    }

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
        ${productId},
        ${userId || null},
        ${sessionId},
        ${options.ipAddress || null},
        ${options.userAgent || null},
        ${options.referrer || null},
        NOW()
      )
    `
  } catch (error) {
    console.error("Error tracking product view:", error)
    throw error
  }
}

// Get trending products
export async function getTrendingProducts(
  limit = 10,
  timeframe: "daily" | "weekly" | "monthly" = "weekly",
): Promise<TrendingProduct[]> {
  try {
    const timeCondition = {
      daily: "pv.viewed_at >= NOW() - INTERVAL '1 day'",
      weekly: "pv.viewed_at >= NOW() - INTERVAL '7 days'",
      monthly: "pv.viewed_at >= NOW() - INTERVAL '30 days'",
    }[timeframe]

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
      LEFT JOIN product_views pv ON p.id = pv.product_id
      WHERE ${timeCondition}
      GROUP BY p.id, p.name, p.category, p.price, p.image_url
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
    throw error
  }
}

// Get analytics dashboard data
export async function getAnalyticsDashboard(
  period: "daily" | "weekly" | "monthly" = "weekly",
): Promise<AnalyticsDashboard> {
  try {
    const timeCondition = {
      daily: "pv.viewed_at >= NOW() - INTERVAL '1 day'",
      weekly: "pv.viewed_at >= NOW() - INTERVAL '7 days'",
      monthly: "pv.viewed_at >= NOW() - INTERVAL '30 days'",
    }[period]

    const previousTimeCondition = {
      daily: "pv.viewed_at >= NOW() - INTERVAL '2 days' AND pv.viewed_at < NOW() - INTERVAL '1 day'",
      weekly: "pv.viewed_at >= NOW() - INTERVAL '14 days' AND pv.viewed_at < NOW() - INTERVAL '7 days'",
      monthly: "pv.viewed_at >= NOW() - INTERVAL '60 days' AND pv.viewed_at < NOW() - INTERVAL '30 days'",
    }[period]

    // Get total views and unique viewers
    const [totalStats] = await sql`
      SELECT 
        COUNT(pv.id) as total_views,
        COUNT(DISTINCT COALESCE(pv.user_id, pv.session_id)) as unique_viewers
      FROM product_views pv
      WHERE ${timeCondition}
    `

    // Get previous period stats for growth calculation
    const [previousStats] = await sql`
      SELECT 
        COUNT(pv.id) as total_views,
        COUNT(DISTINCT COALESCE(pv.user_id, pv.session_id)) as unique_viewers
      FROM product_views pv
      WHERE ${previousTimeCondition}
    `

    // Get top products
    const topProducts = await getTrendingProducts(5, period)

    // Get category performance
    const categoryPerformance = await sql`
      SELECT 
        p.category,
        COUNT(pv.id) as view_count,
        COUNT(DISTINCT COALESCE(pv.user_id, pv.session_id)) as unique_viewers,
        0 as conversion_rate
      FROM products p
      LEFT JOIN product_views pv ON p.id = pv.product_id
      WHERE ${timeCondition}
      GROUP BY p.category
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
      previousStats.total_views > 0
        ? ((Number(totalStats.total_views) - Number(previousStats.total_views)) / Number(previousStats.total_views)) *
          100
        : 0

    const uniqueViewersGrowth =
      previousStats.unique_viewers > 0
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
    throw error
  }
}

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
