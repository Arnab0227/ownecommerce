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
  overview: {
    totalRevenue: number
    revenueChange: number
    totalOrders: number
    ordersChange: number
    totalCustomers: number
    customersChange: number
    averageOrderValue: number
    aovChange: number
  }
  salesData: {
    date: string
    revenue: number
    orders: number
  }[]
  topProducts: {
    id: string
    name: string
    sales: number
    revenue: number
    views: number
  }[]
  customerInsights: {
    newCustomers: number
    returningCustomers: number
    customerRetentionRate: number
  }
  categoryPerformance: {
    category: string
    revenue: number
    orders: number
    growth: number
  }[]
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
    let intervalDays: number

    switch (period) {
      case "daily":
        intervalDays = 1
        break
      case "weekly":
        intervalDays = 7
        break
      case "monthly":
        intervalDays = 30
        break
      default:
        intervalDays = 7
    }

    const startDate = new Date(Date.now() - intervalDays * 24 * 60 * 60 * 1000)

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
      LEFT JOIN product_views pv ON p.id = pv.product_id AND pv.viewed_at >= ${startDate.toISOString()}
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

export async function getAnalyticsDashboard(
  period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" = "monthly",
): Promise<AnalyticsDashboard> {
  try {
    let intervalDays: number
    let previousIntervalDays: number

    switch (period) {
      case "daily":
        intervalDays = 1
        previousIntervalDays = 2
        break
      case "weekly":
        intervalDays = 7
        previousIntervalDays = 14
        break
      case "monthly":
        intervalDays = 30
        previousIntervalDays = 60
        break
      case "quarterly":
        intervalDays = 90
        previousIntervalDays = 180
        break
      case "yearly":
        intervalDays = 365
        previousIntervalDays = 730
        break
      default:
        intervalDays = 30
        previousIntervalDays = 60
    }

    const currentDate = new Date()
    const startDate = new Date(currentDate.getTime() - intervalDays * 24 * 60 * 60 * 1000)
    const previousStartDate = new Date(currentDate.getTime() - previousIntervalDays * 24 * 60 * 60 * 1000)
    const previousEndDate = new Date(currentDate.getTime() - intervalDays * 24 * 60 * 60 * 1000)

    const currentStatsResult = await sql`
      SELECT 
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COUNT(o.id) as total_orders,
        COUNT(DISTINCT o.user_id) as total_customers,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value
      FROM orders o
      WHERE o.created_at >= ${startDate.toISOString()} AND o.status != 'cancelled'
    `

    const previousStatsResult = await sql`
      SELECT 
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COUNT(o.id) as total_orders,
        COUNT(DISTINCT o.user_id) as total_customers,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value
      FROM orders o
      WHERE o.created_at >= ${previousStartDate.toISOString()}
        AND o.created_at < ${previousEndDate.toISOString()}
        AND o.status != 'cancelled'
    `

    const currentStats = currentStatsResult[0] || {
      total_revenue: 0,
      total_orders: 0,
      total_customers: 0,
      avg_order_value: 0,
    }
    const previousStats = previousStatsResult[0] || {
      total_revenue: 0,
      total_orders: 0,
      total_customers: 0,
      avg_order_value: 0,
    }

    // Calculate percentage changes
    const revenueChange =
      Number(previousStats.total_revenue) > 0
        ? ((Number(currentStats.total_revenue) - Number(previousStats.total_revenue)) /
            Number(previousStats.total_revenue)) *
          100
        : 0

    const ordersChange =
      Number(previousStats.total_orders) > 0
        ? ((Number(currentStats.total_orders) - Number(previousStats.total_orders)) /
            Number(previousStats.total_orders)) *
          100
        : 0

    const customersChange =
      Number(previousStats.total_customers) > 0
        ? ((Number(currentStats.total_customers) - Number(previousStats.total_customers)) /
            Number(previousStats.total_customers)) *
          100
        : 0

    const aovChange =
      Number(previousStats.avg_order_value) > 0
        ? ((Number(currentStats.avg_order_value) - Number(previousStats.avg_order_value)) /
            Number(previousStats.avg_order_value)) *
          100
        : 0

    const salesDataResult = await sql`
      SELECT 
        DATE(o.created_at) as date,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COUNT(o.id) as orders
      FROM orders o
      WHERE o.created_at >= ${startDate.toISOString()} AND o.status != 'cancelled'
      GROUP BY DATE(o.created_at)
      ORDER BY date ASC
    `

    const topProductsResult = await sql`
      SELECT 
        p.id,
        p.name,
        SUM(oi.quantity) as sales,
        SUM(oi.total) as revenue,
        COALESCE(pv.view_count, 0) as views
      FROM products p
      INNER JOIN order_items oi ON p.id = oi.product_id
      INNER JOIN orders o ON oi.order_id = o.id
      LEFT JOIN (
        SELECT product_id, COUNT(*) as view_count
        FROM product_views 
        WHERE viewed_at >= ${startDate.toISOString()}
        GROUP BY product_id
      ) pv ON p.id = pv.product_id
      WHERE o.created_at >= ${startDate.toISOString()} AND o.status != 'cancelled'
      GROUP BY p.id, p.name, pv.view_count
      ORDER BY revenue DESC
      LIMIT 5
    `

    const customerInsightsResult = await sql`
      SELECT 
        COUNT(CASE WHEN customer_orders.order_count = 1 THEN 1 END) as new_customers,
        COUNT(CASE WHEN customer_orders.order_count > 1 THEN 1 END) as returning_customers
      FROM (
        SELECT 
          user_id,
          COUNT(*) as order_count
        FROM orders o
        WHERE o.created_at >= ${startDate.toISOString()} AND o.status != 'cancelled'
        GROUP BY user_id
      ) customer_orders
    `

    const categoryPerformanceResult = await sql`
      SELECT 
        p.category,
        COALESCE(SUM(oi.total), 0) as revenue,
        COUNT(DISTINCT o.id) as orders,
        0 as growth
      FROM products p
      INNER JOIN order_items oi ON p.id = oi.product_id
      INNER JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= ${startDate.toISOString()} AND o.status != 'cancelled'
      GROUP BY p.category
      ORDER BY revenue DESC
    `

    const customerInsights = customerInsightsResult[0] || { new_customers: 0, returning_customers: 0 }
    const totalCustomersForRetention =
      Number(customerInsights.new_customers) + Number(customerInsights.returning_customers)
    const customerRetentionRate =
      totalCustomersForRetention > 0
        ? (Number(customerInsights.returning_customers) / totalCustomersForRetention) * 100
        : 0

    return {
      overview: {
        totalRevenue: Number(currentStats.total_revenue),
        revenueChange: Number(revenueChange.toFixed(1)),
        totalOrders: Number(currentStats.total_orders),
        ordersChange: Number(ordersChange.toFixed(1)),
        totalCustomers: Number(currentStats.total_customers),
        customersChange: Number(customersChange.toFixed(1)),
        averageOrderValue: Number(currentStats.avg_order_value),
        aovChange: Number(aovChange.toFixed(1)),
      },
      salesData: salesDataResult.map((row) => ({
        date: row.date,
        revenue: Number(row.revenue),
        orders: Number(row.orders),
      })),
      topProducts: topProductsResult.map((row) => ({
        id: String(row.id),
        name: row.name,
        sales: Number(row.sales),
        revenue: Number(row.revenue),
        views: Number(row.views),
      })),
      customerInsights: {
        newCustomers: Number(customerInsights.new_customers),
        returningCustomers: Number(customerInsights.returning_customers),
        customerRetentionRate: Number(customerRetentionRate.toFixed(1)),
      },
      categoryPerformance: categoryPerformanceResult.map((row) => ({
        category: row.category,
        revenue: Number(row.revenue),
        orders: Number(row.orders),
        growth: Number(row.growth),
      })),
    }
  } catch (error) {
    console.error("Error getting analytics dashboard:", error)
    // Return empty data structure instead of throwing
    return {
      overview: {
        totalRevenue: 0,
        revenueChange: 0,
        totalOrders: 0,
        ordersChange: 0,
        totalCustomers: 0,
        customersChange: 0,
        averageOrderValue: 0,
        aovChange: 0,
      },
      salesData: [],
      topProducts: [],
      customerInsights: {
        newCustomers: 0,
        returningCustomers: 0,
        customerRetentionRate: 0,
      },
      categoryPerformance: [],
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
      totalViews: dashboard.topProducts.reduce((sum, p) => sum + p.views, 0),
      uniqueViewers: 0, // Would need separate tracking
      topProducts: [], // Convert format if needed
      growthMetrics: {
        viewsGrowth: 0,
        uniqueViewersGrowth: 0,
        topGrowingProduct: dashboard.topProducts[0]?.name || "N/A",
        topGrowingCategory: dashboard.categoryPerformance[0]?.category || "N/A",
      },
    }
  } catch (error) {
    console.error("Error generating email report data:", error)
    throw error
  }
}

// Clean old analytics data (for maintenance)
export async function cleanOldAnalyticsData(daysToKeep = 90): Promise<void> {
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)

    await sql`
      DELETE FROM product_views 
      WHERE viewed_at < ${cutoffDate.toISOString()}
    `
  } catch (error) {
    console.error("Error cleaning old analytics data:", error)
    throw error
  }
}
