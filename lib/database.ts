import { neon } from "@neondatabase/serverless"
import { DATABASE_URL, isDevelopment } from "./env"

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

export const sql = neon(DATABASE_URL)

// Database connection test
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1 as test`
    console.log("✅ Database connection successful")
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    return false
  }
}

// Database initialization
export async function initializeDatabase() {
  try {
    // Test connection first
    const isConnected = await testDatabaseConnection()
    if (!isConnected) {
      throw new Error("Database connection failed")
    }

    // Run migrations in development
    if (isDevelopment) {
      console.log("🔄 Running database migrations...")
      // Add your migration logic here
      console.log("✅ Database migrations completed")
    }

    return true
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    throw error
  }
}
