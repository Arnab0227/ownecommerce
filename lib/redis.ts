interface RedisConfig {
  url?: string
  token?: string
}

const getRedisConfig = (): RedisConfig => {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return {
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    }
  }
  if (process.env.REDIS_URL) {
    return {
      url: process.env.REDIS_URL,
    }
  }
  return {}
}

export const cacheKeys = {
  // Products
  allProducts: () => "products:all",
  productById: (id: number | string) => `product:${id}`,
  featuredProducts: () => "products:featured",
  popularProducts: (period = "weekly") => `products:popular:${period}`,
  productViews: (id: number | string) => `product:views:${id}`,

  // Categories
  categories: () => "categories:list",
  categoryProducts: (category: string) => `category:${category}:products`,
  categoryAnalytics: (category: string) => `category:${category}:analytics`,

  // Recently viewed
  recentlyViewed: (userId: string) => `user:${userId}:recently-viewed`,
  sessionRecentlyViewed: (sessionId: string) => `session:${sessionId}:recently-viewed`,

  // Cart and sessions
  userCart: (userId: string) => `cart:${userId}`,
  sessionCart: (sessionId: string) => `cart:session:${sessionId}`,
  cartMetadata: (userId: string) => `cart:${userId}:metadata`,

  // Analytics
  analyticsOverview: (period = "monthly") => `analytics:overview:${period}`,
  analyticsDashboard: (period = "monthly") => `analytics:dashboard:${period}`,
  trendingProducts: (period = "weekly") => `analytics:trending:${period}`,
  viewsCount: (productId: number | string) => `analytics:views:${productId}`,
  categorySales: () => "analytics:category-sales",
  topProducts: (period = "monthly") => `analytics:top-products:${period}`,

  // Search results (cache popular searches)
  searchResults: (query: string) => `search:${query.toLowerCase().replace(/\s+/g, "-")}`,

  // Session data
  userSession: (userId: string) => `session:user:${userId}`,
} as const

// Cache TTL (time-to-live) in seconds
export const cacheTTL = {
  short: 60, // 1 minute
  medium: 5 * 60, // 5 minutes
  long: 30 * 60, // 30 minutes
  veryLong: 60 * 60, // 1 hour
  daily: 24 * 60 * 60, // 1 day
} as const

// Redis operations wrapper
export class RedisCache {
  private static instance: RedisCache | null = null
  private isAvailable = false

  private constructor() {
    const config = getRedisConfig()
    this.isAvailable = !!(config.url || process.env.REDIS_URL)
    if (!this.isAvailable) {
      console.warn("[Redis] No Redis configuration found. Caching will be disabled.")
    }
  }

  static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache()
    }
    return RedisCache.instance
  }

  // Get value from cache
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable) return null
    try {
      const response = await fetch(`${process.env.KV_REST_API_URL}/get/${key}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        },
      })

      if (!response.ok) {
        console.log(`[Redis] GET ${key} returned status ${response.status}`)
        return null
      }

      const data = await response.json()
      console.log(`[Redis] Raw response for ${key}:`, { data, resultType: typeof data?.result })

      // The Upstash REST API returns { result: <value> } where value is a string
      if (!data || data.result === null || data.result === undefined) {
        console.log(`[Redis] No result in response for ${key}`)
        return null
      }

      // If result is a string, try to parse as JSON
      if (typeof data.result === "string") {
        console.log(`[Redis] Parsing string result for ${key}:`, data.result.substring(0, 100))
        try {
          const parsed = JSON.parse(data.result) as T
          console.log(`[Redis] Successfully parsed ${key}:`, { parsed, isArray: Array.isArray(parsed) })
          return parsed
        } catch (parseError) {
          console.error(`[Redis] Failed to parse JSON for ${key}:`, parseError, "Raw value:", data.result)
          return null
        }
      }

      // If result is already an object, validate it's not an error response
      if (typeof data.result === "object" && data.result !== null) {
        if (data.result.error) {
          console.log(`[Redis] Error in result for ${key}:`, data.result.error)
          return null
        }
        console.log(`[Redis] Returning object result for ${key}`)
        return data.result as T
      }

      console.log(`[Redis] Unexpected result type for ${key}:`, typeof data.result)
      return null
    } catch (error) {
      console.error(`[Redis] Error getting key ${key}:`, error)
      return null
    }
  }

  // Set value in cache with TTL
  async set(key: string, value: any, ttl: number = cacheTTL.medium): Promise<boolean> {
    if (!this.isAvailable) return false
    try {
      const response = await fetch(`${process.env.KV_REST_API_URL}/set/${key}?ex=${ttl}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(value),
      })

      return response.ok
    } catch (error) {
      console.error(`[Redis] Error setting key ${key}:`, error)
      return false
    }
  }

  // Delete value from cache
  async delete(key: string): Promise<boolean> {
    if (!this.isAvailable) return false
    try {
      const response = await fetch(`${process.env.KV_REST_API_URL}/del/${key}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        },
      })

      return response.ok
    } catch (error) {
      console.error(`[Redis] Error deleting key ${key}:`, error)
      return false
    }
  }

  // Delete multiple keys
  async deleteMultiple(keys: string[]): Promise<boolean> {
    if (!this.isAvailable || keys.length === 0) return false
    try {
      const response = await fetch(`${process.env.KV_REST_API_URL}/del/${keys.join("/")}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        },
      })

      return response.ok
    } catch (error) {
      console.error(`[Redis] Error deleting multiple keys:`, error)
      return false
    }
  }

  // Get or set pattern - returns cached value or executes callback
  async getOrSet<T>(key: string, callback: () => Promise<T>, ttl: number = cacheTTL.medium): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key)
    if (cached !== null) {
      console.log(`[Redis] Cache hit for key: ${key}`)
      return cached
    }

    console.log(`[Redis] Cache miss for key: ${key}, executing callback`)
    // If not in cache, execute callback
    const result = await callback()

    // Store in cache
    await this.set(key, result, ttl)

    return result
  }

  // Increment counter (useful for view counts)
  async increment(key: string, value = 1): Promise<number> {
    if (!this.isAvailable) return 0
    try {
      const response = await fetch(`${process.env.KV_REST_API_URL}/incr/${key}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ increment: value }),
      })

      if (!response.ok) return 0
      const data = await response.json()
      return data.result as number
    } catch (error) {
      console.error(`[Redis] Error incrementing key ${key}:`, error)
      return 0
    }
  }

  // Add to set (useful for tracking unique views)
  async addToSet(key: string, value: string, ttl: number = cacheTTL.daily): Promise<boolean> {
    if (!this.isAvailable) return false
    try {
      await fetch(`${process.env.KV_REST_API_URL}/sadd/${key}/${value}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        },
      })

      // Set expiry using expire endpoint
      await fetch(`${process.env.KV_REST_API_URL}/expire/${key}/${ttl}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        },
      })

      return true
    } catch (error) {
      console.error(`[Redis] Error adding to set ${key}:`, error)
      return false
    }
  }

  // Get set cardinality (count unique items)
  async getSetSize(key: string): Promise<number> {
    if (!this.isAvailable) return 0
    try {
      const response = await fetch(`${process.env.KV_REST_API_URL}/scard/${key}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        },
      })

      if (!response.ok) return 0
      const data = await response.json()
      return data.result as number
    } catch (error) {
      console.error(`[Redis] Error getting set size for key ${key}:`, error)
      return 0
    }
  }
}

// Export singleton instance
export const redis = RedisCache.getInstance()
