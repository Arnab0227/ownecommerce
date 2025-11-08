import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdmin } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireAdmin(request)
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Fetching customers data with analytics...")

    let customers: any[] = []
    try {
      customers = await sql`
        WITH
        user_keys AS (
          SELECT u.firebase_uid AS user_key,
                 u.id::text AS numeric_id,
                 u.email AS user_email,
                 u.name AS user_name,
                 u.created_at AS user_created_at
          FROM users u
          UNION
          SELECT o.user_id AS user_key,
                 NULL::text AS numeric_id,
                 NULL::text AS user_email,
                 NULL::text AS user_name,
                 MIN(o.created_at) AS user_created_at
          FROM orders o
          WHERE o.user_id IS NOT NULL
          GROUP BY o.user_id
        ),
        order_stats AS (
          SELECT 
            user_id,
            COUNT(*) AS total_orders,
            COALESCE(SUM(total_amount), 0) AS total_spent,
            MAX(created_at) AS last_order_date,
            AVG(total_amount) AS avg_order_value
          FROM orders
          WHERE status IN ('confirmed','processing','shipped','delivered')
            AND user_id IS NOT NULL
          GROUP BY user_id
        ),
        view_stats AS (
          SELECT 
            user_id,
            COUNT(*) AS total_views,
            COUNT(DISTINCT product_id) AS unique_products_viewed,
            MAX(viewed_at) AS last_activity_date
          FROM product_views
          WHERE user_id IS NOT NULL
          GROUP BY user_id
        ),
        last_order_meta AS (
          SELECT 
            o.user_id,
            o.email,
            o.shipping_address,
            o.created_at,
            ROW_NUMBER() OVER (PARTITION BY o.user_id ORDER BY o.created_at DESC) AS rn
          FROM orders o
          WHERE o.user_id IS NOT NULL
        ),
        last_order AS (
          SELECT user_id, email, shipping_address, created_at
          FROM last_order_meta
          WHERE rn = 1
        )
        SELECT 
          uk.user_key                                    AS id,
          COALESCE(uk.user_email, lo.email)              AS email,
          COALESCE(uk.user_name, lo.shipping_address->>'name', uk.user_key) AS name,
          uk.user_created_at                             AS created_at,
          COALESCE(os.total_orders, 0)                   AS total_orders,
          COALESCE(os.total_spent, 0)                    AS total_spent,
          os.last_order_date                             AS last_order_date,
          COALESCE(vs.total_views, 0)                    AS total_product_views,
          COALESCE(vs.unique_products_viewed, 0)         AS unique_products_viewed,
          COALESCE(vs.last_activity_date, uk.user_created_at) AS last_activity_date
        FROM user_keys uk
        LEFT JOIN order_stats os ON os.user_id = uk.user_key
        LEFT JOIN view_stats vs ON vs.user_id = uk.user_key
        LEFT JOIN last_order lo ON lo.user_id = uk.user_key
        ORDER BY uk.user_created_at DESC
      `
      console.log("[v0] Successfully fetched", customers.length, "customers (users ∪ orders)")
    } catch (error) {
      console.error("[v0] Error in customers union query:", error)
      throw new Error(`Main query failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }

    const phoneMap = new Map<string, string>()
    try {
      const addresses = await sql`
        SELECT 
          user_id,
          phone,
          ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY is_default DESC, created_at DESC) as rn
        FROM user_addresses
        WHERE phone IS NOT NULL AND phone != ''
      `

      for (const addr of addresses) {
        if (addr.rn === 1) {
          phoneMap.set(addr.user_id, addr.phone)
        }
      }
    } catch (e) {
      console.warn("[v0] user_addresses table missing or error, continuing without phone numbers")
    }

    const addressMap = new Map<string, any[]>()
    try {
      const addresses = await sql`
        SELECT 
          user_id,
          name,
          phone,
          street,
          city,
          state,
          pincode,
          is_default,
          created_at
        FROM user_addresses
        ORDER BY is_default DESC, created_at DESC
      `

      for (const addr of addresses) {
        const list = addressMap.get(addr.user_id) ?? []
        list.push({
          type: addr.is_default ? "default" : "other",
          address: addr.street,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          is_default: addr.is_default,
        })
        addressMap.set(addr.user_id, list)
      }
    } catch (e) {
      console.warn("[v0] Error fetching addresses:", e)
    }

    const orderMap = new Map<string, any[]>()
    try {
      const customerOrders = await sql`
        SELECT 
          o.user_id,
          o.id AS order_id,
          o.order_number,
          o.total_amount,
          o.delivery_fee,
          o.status,
          o.payment_method,
          o.payment_status,
          o.tracking_number,
          o.created_at,
          o.updated_at,
          o.shipping_address,
          o.billing_address
        FROM orders o
        WHERE o.user_id IS NOT NULL
        ORDER BY o.created_at DESC
      `

      for (const order of customerOrders) {
        const list = orderMap.get(order.user_id) ?? []
        list.push({
          id: String(order.order_id),
          order_number: order.order_number,
          total_amount: Number(order.total_amount),
          delivery_fee: Number(order.delivery_fee || 0),
          status: order.status,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          tracking_number: order.tracking_number,
          created_at: order.created_at,
          updated_at: order.updated_at,
          shipping_address: order.shipping_address,
          billing_address: order.billing_address,
        })
        orderMap.set(order.user_id, list)
      }
    } catch (e) {
      console.warn("[v0] Error fetching customer orders:", e)
    }

    const purchaseMap = new Map<string, any[]>()
    try {
      const recentOrdersWithItems = await sql`
        SELECT 
          o.user_id,
          o.id AS order_id,
          o.total_amount,
          o.status,
          o.created_at,
          oi.product_id,
          oi.quantity,
          oi.price,
          COALESCE(oi.total, (oi.quantity * oi.price)) AS line_total,
          COALESCE(p.name, oi.product_name, 'Unknown Product') AS product_name
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON p.id = oi.product_id
        WHERE o.created_at >= NOW() - INTERVAL '30 days'
          AND oi.product_id IS NOT NULL
        ORDER BY o.created_at DESC
      `

      for (const row of recentOrdersWithItems) {
        const list = purchaseMap.get(row.user_id) ?? []
        list.push({
          user_id: String(row.user_id),
          order_id: String(row.order_id),
          product_id: String(row.product_id),
          product_name: row.product_name,
          quantity: Number(row.quantity),
          price: Number(row.price),
          total: Number(row.line_total),
          status: row.status,
          date: row.created_at,
        })
        purchaseMap.set(row.user_id, list)
      }
    } catch (e) {
      console.warn("[v0] Error fetching purchases:", e)
    }

    const behaviorMap = new Map<string, any>()
    try {
      const behaviorData = await sql`
        WITH user_product_views AS (
          SELECT 
            pv.user_id,
            pv.product_id,
            COUNT(*) AS view_count
          FROM product_views pv
          WHERE pv.user_id IS NOT NULL
            AND pv.viewed_at >= NOW() - INTERVAL '90 days'
          GROUP BY pv.user_id, pv.product_id
        )
        SELECT 
          pv.user_id,
          COUNT(*) as total_views,
          COUNT(DISTINCT pv.product_id) as unique_products_viewed,
          COUNT(DISTINCT DATE(pv.viewed_at)) as active_days,
          MAX(pv.viewed_at) as last_view_date,
          0::float AS avg_view_duration,
          STRING_AGG(DISTINCT p.category, ', ') as viewed_categories,
          (
            SELECT p2.name 
            FROM product_views pv2 
            JOIN products p2 ON pv2.product_id = p2.id 
            WHERE pv2.user_id = pv.user_id 
            GROUP BY p2.id, p2.name 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
          ) as most_viewed_product,
          (
            SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
            FROM (
              SELECT 
                p3.id as product_id,
                p3.name as product_name,
                upv.view_count as views
              FROM user_product_views upv
              JOIN products p3 ON p3.id = upv.product_id
              WHERE upv.user_id = pv.user_id
                AND upv.view_count > 1
              ORDER BY upv.view_count DESC
              LIMIT 5
            ) t
          ) as repeated_products
        FROM product_views pv
        LEFT JOIN products p ON pv.product_id = p.id
        WHERE pv.user_id IS NOT NULL
          AND pv.viewed_at >= NOW() - INTERVAL '90 days'
        GROUP BY pv.user_id
      `

      for (const behavior of behaviorData) {
        behaviorMap.set(behavior.user_id, {
          total_views: Number(behavior.total_views),
          unique_products_viewed: Number(behavior.unique_products_viewed),
          active_days: Number(behavior.active_days),
          last_view_date: behavior.last_view_date,
          viewed_categories: behavior.viewed_categories?.split(", ") || [],
          most_viewed_product: behavior.most_viewed_product,
          engagement_score: Math.min(
            100,
            Math.round(
              Number(behavior.total_views) * 0.3 +
                Number(behavior.unique_products_viewed) * 0.4 +
                Number(behavior.active_days) * 0.3,
            ),
          ),
          avg_view_duration: Number(behavior.avg_view_duration || 0),
          repeated_products: behavior.repeated_products || [],
        })
      }
      console.log("[v0] Behavior data users:", behaviorData.length)
    } catch (e) {
      console.error("[v0] Error fetching behavior analytics:", e)
    }

    const orderFrequencyMap = new Map<string, any>()
    try {
      // First, calculate the lag values in a CTE, then aggregate
      const frequencyData = await sql`
        WITH order_intervals AS (
          SELECT 
            user_id,
            created_at,
            LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at) as prev_order_date,
            EXTRACT(DOW FROM created_at) as order_day_of_week,
            EXTRACT(MONTH FROM created_at) as order_month
          FROM orders
          WHERE status IN ('confirmed', 'processing', 'shipped', 'delivered')
            AND user_id IS NOT NULL
        )
        SELECT 
          user_id,
          COUNT(*) as total_orders,
          AVG(EXTRACT(EPOCH FROM (created_at - prev_order_date)) / 86400) as avg_days_between_orders,
          EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 86400 as days_since_last_order,
          ARRAY_AGG(DISTINCT order_day_of_week) as order_days_of_week,
          ARRAY_AGG(DISTINCT order_month) as order_months
        FROM order_intervals
        WHERE prev_order_date IS NOT NULL
        GROUP BY user_id
        HAVING COUNT(*) > 1
      `

      for (const freq of frequencyData) {
        const avgDaysBetween = Number(freq.avg_days_between_orders || 0)
        const daysSinceLastOrder = Number(freq.days_since_last_order || 0)

        let frequency_category = "new"
        if (avgDaysBetween > 0) {
          if (avgDaysBetween <= 30) frequency_category = "frequent"
          else if (avgDaysBetween <= 90) frequency_category = "regular"
          else frequency_category = "occasional"
        }

        orderFrequencyMap.set(freq.user_id, {
          avg_days_between_orders: avgDaysBetween,
          days_since_last_order: daysSinceLastOrder,
          frequency_category,
          order_days_of_week: freq.order_days_of_week || [],
          order_months: freq.order_months || [],
          is_at_risk: daysSinceLastOrder > avgDaysBetween * 2 && daysSinceLastOrder > 60,
        })
      }
    } catch (e) {
      console.warn("[v0] Error calculating order frequency:", e)
    }

    const customersWithDetails = customers.map((c) => {
      const key = c.id
      const behavior = behaviorMap.get(key) || {}
      const frequency = orderFrequencyMap.get(key) || {}

      return {
        id: String(c.id),
        email: c.email,
        display_name: c.name,
        phone: phoneMap.get(key) || "",
        created_at: c.created_at,
        status: "active" as const,
        total_orders: Number(c.total_orders || 0),
        total_spent: Number(c.total_spent || 0),
        last_order_date: c.last_order_date,
        loyalty_points: Math.floor(Number(c.total_spent || 0) / 100),
        addresses: addressMap.get(key) || [],
        purchases: purchaseMap.get(key) || [],
        orders: orderMap.get(key) || [],
        analytics: {
          total_product_views: Number(c.total_product_views || 0),
          unique_products_viewed: Number(c.unique_products_viewed || 0),
          avg_session_duration: 0,
          last_activity_date: c.last_activity_date,
          engagement_score: behavior.engagement_score || 0,
          most_viewed_product: behavior.most_viewed_product || null,
          viewed_categories: behavior.viewed_categories || [],
          active_days: behavior.active_days || 0,
          avg_view_duration: behavior.avg_view_duration || 0,
          repeated_products: behavior.repeated_products || [],
          frequency_category: frequency.frequency_category || "new",
          avg_days_between_orders: frequency.avg_days_between_orders || 0,
          days_since_last_order: frequency.days_since_last_order || 0,
          is_at_risk: frequency.is_at_risk || false,
          order_patterns: {
            preferred_days: frequency.order_days_of_week || [],
            preferred_months: frequency.order_months || [],
          },
        },
      }
    })

    const sanitizedCustomers = customersWithDetails.filter((cust) => {
      const nm = (cust.display_name || "").toLowerCase()
      const em = (cust.email || "").toLowerCase()
      const ph = (cust.phone || "").replace(/\s+/g, "")
      return !(
        nm === "john doe" ||
        em === "customer@example.com" ||
        cust.id === "firebase_uid_123" ||
        ph === "+919876543210" ||
        ph === "919876543210"
      )
    })

    console.log("[v0] Returning", sanitizedCustomers.length, "customers with analytics (sanitized)")
    console.log("[v0] Sample customer analytics:", sanitizedCustomers[0]?.analytics || {})

    return NextResponse.json({ customers: sanitizedCustomers })
  } catch (error: unknown) {
    console.error("[v0] Error fetching customers:", error)
    console.error("[v0] Full error stack:", error instanceof Error ? error.stack : "No stack trace")
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ error: "Failed to fetch customers", details: errorMessage }, { status: 500 })
  }
}
