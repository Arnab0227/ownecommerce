"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, ChevronRight, Clock, X } from "lucide-react"
import { useAuth } from "@/hooks/use-firebase-auth"
import { toast } from "@/hooks/use-toast"

interface RecentlyViewedProduct {
  id: string | number
  name: string
  price: number
  original_price?: number
  imageUrl?: string
  category?: string
  viewedAt: number
}

export function RecentlyViewed() {
  const { user } = useAuth()
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionId] = useState(() => {
    if (typeof window !== "undefined") {
      let id = sessionStorage.getItem("sessionId")
      if (!id) {
        id = `session_${Date.now()}_${Math.random()}`
        sessionStorage.setItem("sessionId", id)
      }
      return id
    }
    return ""
  })

  useEffect(() => {
    fetchRecentlyViewed()
  }, [user, sessionId])

  const fetchRecentlyViewed = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (user?.uid) {
        params.append("userId", user.uid)
      } else if (sessionId) {
        params.append("sessionId", sessionId)
      }

      const response = await fetch(`/api/recently-viewed?${params}&limit=5`)
      const data = await response.json()

      if (data.success) {
        setProducts(data.recentlyViewed)
      }
    } catch (error) {
      console.error("[v0] Error fetching recently viewed:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (productId: string | number) => {
    try {
      await fetch("/api/recently-viewed", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid,
          sessionId,
          productId,
        }),
      })

      setProducts((prev) => prev.filter((p) => p.id !== productId))
      toast({
        title: "Removed",
        description: "Product removed from recently viewed",
      })
    } catch (error) {
      console.error("[v0] Error removing product:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          <h2 className="text-2xl font-bold">Recently Viewed</h2>
        </div>
        <Link href="/recently-viewed" className="text-orange-600 hover:text-orange-700 flex items-center gap-1">
          View All <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {products.map((product) => {
          const discountPercentage =
            product.original_price && product.original_price > product.price
              ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
              : 0

          const viewedTime = new Date(product.viewedAt)
          const timeAgo = getTimeAgo(viewedTime)

          return (
            <Card key={product.id} className="group relative overflow-hidden hover:shadow-lg transition-shadow">
              <Link href={`/products/${product.id}`}>
                <div className="relative h-40 overflow-hidden bg-gray-100">
                  <Image
                    src={product.imageUrl || "/placeholder.svg?height=160&width=160"}
                    alt={product.name}
                    width={160}
                    height={160}
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
                  <h3 className="font-semibold text-sm line-clamp-2 hover:text-orange-600 mb-1">{product.name}</h3>
                </Link>

                <div className="flex items-center mb-2">
                  <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                  <span className="text-xs text-gray-600">({product.category})</span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-green-600 text-sm">₹{product.price.toLocaleString("en-IN")}</span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-xs text-gray-500 line-through">₹{product.original_price}</span>
                  )}
                </div>

                <p className="text-xs text-gray-500 mb-2">{timeAgo}</p>

                <button
                  onClick={() => handleRemove(product.id)}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove from recently viewed"
                >
                  <X className="h-3 w-3 text-gray-600" />
                </button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return "Just now"
}
