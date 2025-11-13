"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Clock } from "lucide-react"
import { useAuth } from "@/hooks/use-firebase-auth"

interface RecentlyViewedProduct {
  id: string | number
  name: string
  price: number
  original_price?: number
  imageUrl?: string
  category?: string
  rating?: number
}

export function RecentlyViewed() {
  const { user } = useAuth()
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial fetch
    fetchRecentlyViewed()

    // Set up event listeners for product views
    const handleProductViewed = () => {
      console.log("[v0] Product viewed event detected, refetching...")
      setTimeout(() => {
        fetchRecentlyViewed()
      }, 100)
    }

    window.addEventListener("product-viewed", handleProductViewed)
    window.addEventListener("storage", handleProductViewed)

    return () => {
      window.removeEventListener("product-viewed", handleProductViewed)
      window.removeEventListener("storage", handleProductViewed)
    }
  }, [user])

  const fetchRecentlyViewed = async () => {
    try {
      setLoading(true)

      const sessionId = sessionStorage.getItem("sessionId")
      const params = new URLSearchParams()

      if (user?.uid) {
        params.append("userId", user.uid)
        console.log("[v0] Using userId:", user.uid)
      } else if (sessionId) {
        params.append("sessionId", sessionId)
        console.log("[v0] Using sessionId:", sessionId)
      }

      if (!params.has("userId") && !params.has("sessionId")) {
        console.log("[v0] No userId or sessionId available")
        setProducts([])
        setLoading(false)
        return
      }

      params.append("limit", "10")

      console.log("[v0] Fetching recently viewed with params:", params.toString())

      const response = await fetch(`/api/recently-viewed?${params.toString()}`)

      console.log("[v0] API response status:", response.status)

      const data = await response.json()

      console.log("[v0] Recently viewed response:", data)
      if (data.success && data.products && Array.isArray(data.products)) {
        console.log(
          `[v0] Found ${data.products.length} recently viewed products:`,
          data.products.map((p: any) => p.id),
        )
        setProducts(data.products.length > 0 ? data.products : [])
      } else {
        console.log("[v0] Invalid response format:", data)
        setProducts([])
      }
    } catch (error) {
      console.error("[v0] Error fetching recently viewed:", error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-56 w-48 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="w-full py-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-blue-600" />
          <h2 className="text-2xl font-bold">Recently Viewed</h2>
        </div>
        <p className="text-gray-500">No recently viewed items yet</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-blue-600" />
        <h2 className="text-2xl font-bold">Recently Viewed</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        {products.map((product) => {
          const discountPercentage =
            product.original_price && product.original_price > product.price
              ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
              : 0

          return (
            <Card
              key={product.id}
              className="group relative overflow-hidden hover:shadow-lg transition-shadow flex-shrink-0 w-48 snap-center"
            >
              <Link href={`/products/${product.id}`}>
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <Image
                    src={product.imageUrl || "/placeholder.svg?height=192&width=192"}
                    alt={product.name}
                    width={192}
                    height={192}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {discountPercentage > 0 && (
                    <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                      {discountPercentage}% OFF
                    </Badge>
                  )}
                </div>
              </Link>

              <CardContent className="p-3">
                <Link href={`/products/${product.id}`}>
                  <h3 className="font-semibold text-sm line-clamp-2 hover:text-blue-600 mb-1">{product.name}</h3>
                </Link>

                <div className="flex items-center mb-2">
                  <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                  <span className="text-xs text-gray-600">({product.category || "N/A"})</span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-green-600 text-sm">₹{product.price.toLocaleString("en-IN")}</span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-xs text-gray-500 line-through">
                      ₹{product.original_price.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>

                <Link href={`/products/${product.id}`}>
                  <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                    View
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
