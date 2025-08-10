"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-firebase-auth"

// Track product view
export function useProductViewTracking() {
  const { user } = useAuth()

  const trackView = async (productId: number) => {
    try {
      const sessionId = getOrCreateSessionId()
      const authToken = user ? await user.getIdToken() : undefined

      await fetch("/api/analytics/track-view", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          sessionId,
          authToken,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        }),
      })
    } catch (error) {
      console.error("Error tracking product view:", error)
    }
  }

  return { trackView }
}

// Get or create session ID
function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem("analytics_session_id")

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem("analytics_session_id", sessionId)
  }

  return sessionId
}

// Hook for analytics dashboard data
export function useAnalyticsDashboard(period: "daily" | "weekly" | "monthly" = "weekly") {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/analytics/dashboard?period=${period}`)

        if (!response.ok) {
          throw new Error("Failed to fetch analytics data")
        }

        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [period])

  return { data, loading, error, refetch: fetchData }
}

// Hook for trending products
export function useTrendingProducts(limit = 10, timeframe: "daily" | "weekly" | "monthly" = "weekly") {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/analytics/trending?limit=${limit}&timeframe=${timeframe}`)

        if (!response.ok) {
          throw new Error("Failed to fetch trending products")
        }

        const result = await response.json()
        setProducts(result.products)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
  }, [limit, timeframe])

  return { products, loading, error }
}
