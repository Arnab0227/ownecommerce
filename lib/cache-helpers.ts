import { redis, cacheKeys, cacheTTL } from "./redis"
import type { Product } from "@/types"

// Cache recently viewed items for a user or session
export async function cacheRecentlyViewed(
  userId: string | null,
  sessionId: string | null,
  productId: number | string,
): Promise<void> {
  if (!userId && !sessionId) return

  try {
    const key = userId ? cacheKeys.recentlyViewed(userId) : cacheKeys.sessionRecentlyViewed(sessionId!)

    // Get existing recently viewed list
    const existing = (await redis.get<(number | string)[]>(key)) || []

    // Remove if already in list and add to front (most recent)
    const updated = [productId, ...existing.filter((id) => id !== productId)].slice(0, 20)

    await redis.set(key, updated, cacheTTL.veryLong)
  } catch (error) {
    console.error("[Cache] Error caching recently viewed:", error)
  }
}

// Get recently viewed items
export async function getRecentlyViewed(userId: string | null, sessionId: string | null): Promise<(number | string)[]> {
  if (!userId && !sessionId) return []

  try {
    const key = userId ? cacheKeys.recentlyViewed(userId) : cacheKeys.sessionRecentlyViewed(sessionId!)
    const items = await redis.get<(number | string)[]>(key)
    return items || []
  } catch (error) {
    console.error("[Cache] Error getting recently viewed:", error)
    return []
  }
}

// Cache user cart with metadata
export async function cacheUserCart(
  userId: string,
  cartItems: any[],
  metadata?: { lastUpdated?: number; itemCount?: number },
): Promise<void> {
  try {
    const key = cacheKeys.userCart(userId)
    const metadataKey = cacheKeys.cartMetadata(userId)

    await redis.set(key, cartItems, cacheTTL.daily)
    if (metadata) {
      await redis.set(metadataKey, { ...metadata, timestamp: Date.now() }, cacheTTL.daily)
    }
  } catch (error) {
    console.error("[Cache] Error caching user cart:", error)
  }
}

// Get user cart from cache
export async function getUserCartFromCache(userId: string): Promise<any[] | null> {
  try {
    return await redis.get<any[]>(cacheKeys.userCart(userId))
  } catch (error) {
    console.error("[Cache] Error getting user cart:", error)
    return null
  }
}

// Invalidate user cart cache
export async function invalidateUserCartCache(userId: string): Promise<void> {
  try {
    await redis.deleteMultiple([cacheKeys.userCart(userId), cacheKeys.cartMetadata(userId)])
  } catch (error) {
    console.error("[Cache] Error invalidating user cart:", error)
  }
}

// Track product view with caching
export async function trackAndCacheProductView(
  productId: number | string,
  userId: string | null,
  sessionId: string | null,
): Promise<void> {
  try {
    const viewKey = cacheKeys.productViews(productId)
    const uniqueViewersKey = `${viewKey}:unique`

    // Increment total view count
    await redis.increment(viewKey, 1)

    // Track unique viewers
    if (userId) {
      await redis.addToSet(uniqueViewersKey, userId, cacheTTL.daily)
    } else if (sessionId) {
      await redis.addToSet(uniqueViewersKey, sessionId, cacheTTL.daily)
    }

    // Set expiry if first time
    await redis.set(viewKey, await redis.get<number>(viewKey), cacheTTL.daily)
  } catch (error) {
    console.error("[Cache] Error tracking product view:", error)
  }
}

// Cache featured products
export async function cacheFeaturedProducts(products: Product[]): Promise<void> {
  try {
    await redis.set(cacheKeys.featuredProducts(), products, cacheTTL.veryLong)
  } catch (error) {
    console.error("[Cache] Error caching featured products:", error)
  }
}

// Cache popular products by period
export async function cachePopularProducts(period: string, products: any[]): Promise<void> {
  try {
    await redis.set(cacheKeys.popularProducts(period), products, cacheTTL.long)
  } catch (error) {
    console.error("[Cache] Error caching popular products:", error)
  }
}

// Cache category analytics
export async function cacheCategoryAnalytics(category: string, data: any): Promise<void> {
  try {
    await redis.set(cacheKeys.categoryAnalytics(category), data, cacheTTL.long)
  } catch (error) {
    console.error("[Cache] Error caching category analytics:", error)
  }
}

// Cache analytics dashboard
export async function cacheAnalyticsDashboard(period: string, dashboard: any): Promise<void> {
  try {
    await redis.set(cacheKeys.analyticsDashboard(period), dashboard, cacheTTL.long)
  } catch (error) {
    console.error("[Cache] Error caching analytics dashboard:", error)
  }
}
