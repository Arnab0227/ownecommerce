"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ArrowRight } from "lucide-react"

interface Product {
  id: string | number
  name: string
  price: number
  original_price: number
  image_url: string
  rating?: number
  category: string
}

interface ProductSectionProps {
  collection: string
  title: string
  description?: string
  limit?: number
}

export function ProductSection({ collection, title, description, limit = 8 }: ProductSectionProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`/api/products/by-collection?collection=${collection}&limit=${limit}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data)
        }
      } catch (error) {
        console.error("Error fetching collection products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [collection, limit])

  if (isLoading) {
    return (
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">{title}</h2>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className="py-12 px-4 bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-amber-900 mb-2">{title}</h2>
          {description && <p className="text-gray-600">{description}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-0">
                  <div className="relative w-full aspect-square bg-gray-200 rounded-t-lg overflow-hidden">
                    <Image
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover hover:scale-105 transition-transform"
                    />
                    {product.original_price > product.price && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-xl font-bold text-amber-600">₹{product.price}</span>
                      {product.original_price > product.price && (
                        <span className="text-sm text-gray-500 line-through">₹{product.original_price}</span>
                      )}
                    </div>
                    {product.rating && (
                      <div className="mb-3">
                        <span className="text-sm text-yellow-500">⭐ {product.rating.toFixed(1)}</span>
                      </div>
                    )}
                    <Button className="w-full bg-amber-600 hover:bg-amber-700">View Details</Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href={`/products?collection=${collection}`}>
            <Button variant="outline" className="border-amber-600 text-amber-600 hover:bg-amber-50 bg-transparent">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
