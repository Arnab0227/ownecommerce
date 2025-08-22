"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Star, ShoppingCart, Heart, Truck, Shield, RotateCcw, Minus, Plus } from 'lucide-react'
import { useCart, type Product } from "@/hooks/use-cart"
import { toast } from "@/hooks/use-toast"

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id])

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
      } else {
        console.error("Failed to fetch product")
      }
    } catch (error) {
      console.error("Error fetching product:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (product) {
      console.log("ProductPage: Adding to cart:", product, "quantity:", quantity)
      addItem(product, quantity)
      toast({
        title: "Added to cart",
        description: `${quantity} x ${product.name} added to your cart.`,
      })
    }
  }

  const handleBuyNow = () => {
    if (product) {
      console.log("ProductPage: Buy now - adding to cart:", product, "quantity:", quantity)
      addItem(product, quantity)
      router.push("/cart")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-200 animate-pulse rounded-lg h-96"></div>
          <div className="space-y-4">
            <div className="bg-gray-200 animate-pulse rounded h-8 w-3/4"></div>
            <div className="bg-gray-200 animate-pulse rounded h-4 w-1/2"></div>
            <div className="bg-gray-200 animate-pulse rounded h-6 w-1/4"></div>
            <div className="bg-gray-200 animate-pulse rounded h-20 w-full"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
      </div>
    )
  }

  const discountPercentage = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="relative">
          <Image
            src={product.imageUrl || "/placeholder.svg?height=500&width=500"}
            alt={product.name}
            width={500}
            height={500}
            className="w-full rounded-lg"
          />
          {discountPercentage > 0 && (
            <Badge className="absolute top-4 left-4 bg-red-500 text-white">{discountPercentage}% OFF</Badge>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            {product.model_no && (
              <p className="text-sm text-gray-600 mb-2">Model: {product.model_no}</p>
            )}
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600">({product.rating || 0} rating)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold text-green-600">₹{product.price.toLocaleString("en-IN")}</span>
              {product.original_price && (
                <span className="text-xl text-gray-500 line-through">
                  ₹{product.original_price.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            {discountPercentage > 0 && (
              <p className="text-green-600 font-medium">
                You save ₹{((product.original_price || 0) - product.price).toLocaleString("en-IN")} ({discountPercentage}% off)
              </p>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700">{product.description}</p>
          </div>

          <div className="flex items-center space-x-4">
            <label className="font-medium">Quantity:</label>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="px-4 py-2 border rounded min-w-[3rem] text-center">{quantity}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button onClick={handleAddToCart} variant="outline" className="flex-1 bg-transparent">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
            <Button onClick={handleBuyNow} className="flex-1 bg-orange-600 hover:bg-orange-700">
              Buy Now
            </Button>
            <Button variant="outline" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <Truck className="h-6 w-6 text-green-600 mb-2" />
                  <span className="text-sm font-medium">Free Delivery</span>
                  <span className="text-xs text-gray-600">Above ₹799</span>
                </div>
                <div className="flex flex-col items-center">
                  <RotateCcw className="h-6 w-6 text-blue-600 mb-2" />
                  <span className="text-sm font-medium">Easy Returns</span>
                  <span className="text-xs text-gray-600">7 Days</span>
                </div>
                <div className="flex flex-col items-center">
                  <Shield className="h-6 w-6 text-purple-600 mb-2" />
                  <span className="text-sm font-medium">Warranty</span>
                  <span className="text-xs text-gray-600">1 Year</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
