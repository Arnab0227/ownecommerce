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
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: JSON.stringify({
          product_id: productId,
          sessionId,
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

export function useAnalyticsDashboard(period: "daily" | "weekly" | "monthly" = "weekly") {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get auth token for admin access
        const authToken = user ? await user.getIdToken() : null

        if (!authToken) {
          throw new Error("Authentication required for analytics dashboard")
        }

        const response = await fetch(`/api/analytics/dashboard?period=${period}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized: Admin access required")
          } else if (response.status === 403) {
            throw new Error("Forbidden: Insufficient permissions")
          } else {
            throw new Error(`Failed to fetch analytics data: ${response.statusText}`)
          }
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error("Analytics dashboard error:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    if (user !== undefined) {
      fetchAnalyticsData()
    }
  }, [period, user])

  const refetch = async () => {
    if (user) {
      const fetchAnalyticsData = async () => {
        try {
          setLoading(true)
          setError(null)

          const authToken = await user.getIdToken()
          const response = await fetch(`/api/analytics/dashboard?period=${period}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          })

          if (!response.ok) {
            throw new Error(`Failed to fetch analytics data: ${response.statusText}`)
          }

          const result = await response.json()
          setData(result)
        } catch (err) {
          setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
          setLoading(false)
        }
      }

      await fetchAnalyticsData()
    }
  }

  return { data, loading, error, refetch }
}

export function useTrendingProducts(limit = 10, period: "daily" | "weekly" | "monthly" = "weekly") {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/analytics/trending?limit=${limit}&period=${period}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch trending products: ${response.statusText}`)
        }

        const result = await response.json()
        setProducts(result.products || [])
      } catch (err) {
        console.error("Trending products error:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
  }, [limit, period])

  return { products, loading, error }
}

export function useAdminAnalytics(period: "daily" | "weekly" | "monthly" = "weekly") {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchAdminAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!user) {
          throw new Error("Authentication required")
        }

        const authToken = await user.getIdToken()

        // Fetch both dashboard data and trending products
        const [dashboardResponse, trendingResponse] = await Promise.all([
          fetch(`/api/analytics/dashboard?period=${period}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }),
          fetch(`/api/analytics/trending?limit=10&period=${period}`),
        ])

        if (!dashboardResponse.ok) {
          throw new Error(`Dashboard API error: ${dashboardResponse.statusText}`)
        }

        if (!trendingResponse.ok) {
          throw new Error(`Trending API error: ${trendingResponse.statusText}`)
        }

        const [dashboardData, trendingData] = await Promise.all([dashboardResponse.json(), trendingResponse.json()])

        // Combine data with performance insights
        const combinedAnalytics = {
          ...dashboardData,
          trendingProducts: trendingData.products,
          performanceInsights: {
            topViewedProduct: trendingData.products[0]?.name || "No data",
            topSellingProduct: dashboardData.topProducts[0]?.name || "No data",
            performanceMatrix: {
              totalViews: dashboardData.totalViews,
              uniqueViewers: dashboardData.uniqueViewers,
              conversionRate:
                dashboardData.totalViews > 0
                  ? ((dashboardData.uniqueViewers / dashboardData.totalViews) * 100).toFixed(2)
                  : "0",
              growthRate: dashboardData.growthMetrics?.viewsGrowth?.toFixed(2) || "0",
            },
          },
        }

        setAnalytics(combinedAnalytics)
      } catch (err) {
        console.error("Admin analytics error:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    if (user !== undefined) {
      fetchAdminAnalytics()
    }
  }, [period, user])

  return { analytics, loading, error }
}
