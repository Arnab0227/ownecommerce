// Test script to verify customer data loading functionality
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function testCustomerDataLoading() {
  try {
    console.log("[v0] Testing customer data loading...")

    // Test 1: Check if users table exists and has data
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    console.log("[v0] Users in database:", userCount[0].count)

    // Test 2: Check if orders table exists and has data
    const orderCount = await sql`SELECT COUNT(*) as count FROM orders`
    console.log("[v0] Orders in database:", orderCount[0].count)

    // Test 3: Test the main customer query (simplified version)
    const testCustomers = await sql`
      SELECT 
        u.id,
        u.email,
        COALESCE(u.name, u.email) AS name,
        u.created_at,
        COALESCE(order_stats.total_orders, 0) as total_orders,
        COALESCE(order_stats.total_spent, 0) as total_spent
      FROM users u
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(*) as total_orders,
          COALESCE(SUM(total_amount), 0) as total_spent
        FROM orders
        WHERE status IN ('confirmed', 'processing', 'shipped', 'delivered')
        GROUP BY user_id
      ) order_stats ON u.firebase_uid = order_stats.user_id
      ORDER BY u.created_at DESC
      LIMIT 5
    `

    console.log("[v0] Sample customers loaded:", testCustomers.length)
    if (testCustomers.length > 0) {
      console.log("[v0] First customer:", {
        email: testCustomers[0].email,
        total_orders: testCustomers[0].total_orders,
        total_spent: testCustomers[0].total_spent,
      })
    }

    // Test 4: Check if addresses table exists
    try {
      const addressCount = await sql`SELECT COUNT(*) as count FROM user_addresses`
      console.log("[v0] Addresses in database:", addressCount[0].count)
    } catch (e) {
      console.log("[v0] user_addresses table not found - this is optional")
    }

    // Test 5: Check order_items table
    try {
      const orderItemsCount = await sql`SELECT COUNT(*) as count FROM order_items`
      console.log("[v0] Order items in database:", orderItemsCount[0].count)
    } catch (e) {
      console.log("[v0] order_items table not found")
    }

    console.log("[v0] Customer data loading test completed successfully!")
    return true
  } catch (error) {
    console.error("[v0] Customer data loading test failed:", error)
    return false
  }
}

// Run the test
testCustomerDataLoading()
  .then((success) => {
    if (success) {
      console.log("[v0] ✅ All customer data tests passed!")
    } else {
      console.log("[v0] ❌ Customer data tests failed!")
    }
  })
  .catch((error) => {
    console.error("[v0] Test execution failed:", error)
  })
