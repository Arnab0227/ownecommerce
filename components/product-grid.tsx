"use client"

import { useState, useEffect } from "react"
import { ProductCardWithHover } from "./product-card-with-hover"
import type { Product } from "@/types"

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products", { cache: "no-store" })

      if (!res.ok) {
        const message = await res.text()
        throw new Error(message || "Failed to fetch products")
      }

      const data = (await res.json()) as Product[]
      setProducts(data)
    } catch (err) {
      console.error("Error fetching products:", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 font-medium">Unable to load our collection at the moment.</p>
        <p className="text-gray-500">Please try again later or contact our heritage store.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-gradient-to-b from-amber-100 to-yellow-100 animate-pulse rounded-lg h-80 sm:h-96"
          ></div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-gray-900">Heritage Collection</h2>
      <p className="text-center text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto">
        Discover our carefully curated selection, handpicked with 35+ years of expertise in fashion and quality.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => (
          <ProductCardWithHover key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
