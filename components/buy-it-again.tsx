"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, RefreshCw } from "lucide-react"
import { useAuth } from "@/hooks/use-firebase-auth"
import { getPurchases } from "@/lib/local-storage-purchases"

interface BuyItAgainProduct {
  id: string | number
  name: string
  price: number
  original_price?: number
  imageUrl?: string
  category?: string
  purchasedAt?: number
}

export function BuyItAgain() {
  const { user } = useAuth()
  const [products, setProducts] = useState<BuyItAgainProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [hasBoughtBefore, setHasBoughtBefore] = useState(false)

  useEffect(() => {
    fetchBuyItAgainProducts()

    const handleCartUpdate = () => {
      console.log("[v0] Cart/purchase event detected, refetching buy it again...")
      // Add small delay to ensure database is updated
      setTimeout(() => {
        fetchBuyItAgainProducts()
      }, 100)
    }

    window.addEventListener("cart-updated", handleCartUpdate)
    window.addEventListener("order-completed", handleCartUpdate)
    window.addEventListener("storage", handleCartUpdate)

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate)
      window.removeEventListener("order-completed", handleCartUpdate)
      window.removeEventListener("storage", handleCartUpdate)
    }
  }, [user])

  const fetchBuyItAgainProducts = async () => {
    try {
      setLoading(true)

      if (user?.uid) {
        // Logged-in user - fetch from database
        const response = await fetch(`/api/buy-it-again?userId=${user.uid}&limit=5`)
        const data = await response.json()

        if (data.success && data.products && data.products.length > 0) {
          setProducts(data.products)
          setHasBoughtBefore(true)
        } else {
          setHasBoughtBefore(false)
          setProducts([])
        }
      } else {
        // Non-logged-in user - fetch from local storage
        const localPurchases = getPurchases(5)
        if (localPurchases.length > 0) {
          setProducts(localPurchases as BuyItAgainProduct[])
          setHasBoughtBefore(true)
        } else {
          setHasBoughtBefore(false)
          setProducts([])
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching buy it again products:", error)
      setHasBoughtBefore(false)
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
            <div key={i} className="h-48 w-40 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
          ))}
        </div>
      </div>
    )
  }

  // Only show if user has previously bought products
  if (!hasBoughtBefore || products.length === 0) {
    return null
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-orange-600" />
          <h2 className="text-2xl font-bold">Buy It Again</h2>
        </div>
        {/* Removed "View All" button - using horizontal scroll instead */}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {products.map((product) => {
          const discountPercentage =
            product.original_price && product.original_price > product.price
              ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
              : 0

          return (
            <Card
              key={product.id}
              className="group relative overflow-hidden hover:shadow-lg transition-shadow flex-shrink-0 w-48"
            >
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

                <Link href={`/products/${product.id}`}>
                  <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                    Buy Again
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
