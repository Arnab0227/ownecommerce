// Utility to track purchases for non-logged-in users in local storage
const PURCHASES_KEY = "user_purchases"

interface Purchase {
  productId: string | number
  productName: string
  price: number
  originalPrice?: number
  imageUrl?: string
  category?: string
  purchasedAt: number
}

export interface BuyItAgainProductFromPurchase {
  id: string | number
  name: string
  price: number
  original_price?: number
  imageUrl?: string
  category?: string
  purchasedAt?: number
}

export function addPurchase(product: {
  id: string | number
  name: string
  price: number
  original_price?: number
  imageUrl?: string
  category?: string
}): void {
  if (typeof window === "undefined") return

  try {
    const purchases: Purchase[] = JSON.parse(localStorage.getItem(PURCHASES_KEY) || "[]")

    // Check if product already exists
    const existingIndex = purchases.findIndex((p) => p.productId === product.id)

    const newPurchase: Purchase = {
      productId: product.id,
      productName: product.name,
      price: product.price,
      originalPrice: product.original_price,
      imageUrl: product.imageUrl,
      category: product.category,
      purchasedAt: Date.now(),
    }

    if (existingIndex >= 0) {
      // Move to top (most recent)
      purchases.splice(existingIndex, 1)
    }

    purchases.unshift(newPurchase)

    // Keep only last 20 purchases
    if (purchases.length > 20) {
      purchases.pop()
    }

    localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases))
  } catch (error) {
    console.error("[v0] Error adding purchase to local storage:", error)
  }
}

export function getPurchases(limit = 5): BuyItAgainProductFromPurchase[] {
  if (typeof window === "undefined") return []

  try {
    const purchases: Purchase[] = JSON.parse(localStorage.getItem(PURCHASES_KEY) || "[]")
    return purchases.slice(0, limit).map((p) => ({
      id: p.productId,
      name: p.productName,
      price: p.price,
      original_price: p.originalPrice,
      imageUrl: p.imageUrl,
      category: p.category,
      purchasedAt: p.purchasedAt,
    }))
  } catch (error) {
    console.error("[v0] Error getting purchases from local storage:", error)
    return []
  }
}

export function hasPurchases(): boolean {
  if (typeof window === "undefined") return false

  try {
    const purchases: Purchase[] = JSON.parse(localStorage.getItem(PURCHASES_KEY) || "[]")
    return purchases.length > 0
  } catch {
    return false
  }
}
