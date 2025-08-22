"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, ChevronLeft, ChevronRight, X, Crown } from "lucide-react"
import type { Product } from "@/types"
import { useCart } from "@/hooks/use-cart"
import { toast } from "@/hooks/use-toast"

interface ProductCardWithHoverProps {
  product: Product
}

export function ProductCardWithHover({ product }: ProductCardWithHoverProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { addItem } = useCart()

  // Mock multiple images for demo
  const productImages = [
    product.imageUrl || "/placeholder.svg?height=400&width=400",
    "/placeholder.svg?height=400&width=400",
    "/placeholder.svg?height=400&width=400",
    "/placeholder.svg?height=400&width=400",
  ]

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length)
  }

  const discountPercentage = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0

  return (
    <>
      {/* Regular Card */}
      <Card
        className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-amber-100 bg-gradient-to-b from-white to-amber-50/30"
        onMouseEnter={() => setIsHovered(true)}
      >
        <Link href={`/products/${product.id}`}>
          <div className="relative overflow-hidden rounded-t-lg">
            <Image
              src={product.imageUrl || "/placeholder.svg?height=300&width=300"}
              alt={product.name}
              width={300}
              height={300}
              className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {discountPercentage > 0 && (
              <Badge className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg">
                {discountPercentage}% OFF
              </Badge>
            )}
            <div className="absolute top-3 right-3">
              <Crown className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </Link>

        <CardContent className="p-4 sm:p-6">
          <Link href={`/products/${product.id}`}>
            <h3 className="font-semibold text-lg mb-3 line-clamp-2 hover:text-amber-600 transition-colors text-gray-900">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center space-x-2 mb-4">
            <span className="text-xl sm:text-2xl font-bold text-amber-600">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.original_price && (
              <span className="text-sm text-gray-500 line-through">
                ₹{product.original_price.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-4">{product.description}</p>

          <div className="text-xs text-amber-600 font-medium mb-3">✨ Heritage Quality • Handpicked Selection</div>
        </CardContent>

        <CardFooter className="p-4 sm:p-6 pt-0">
          <Button
            onClick={handleAddToCart}
            className="w-full bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 hover:from-amber-700 hover:via-yellow-700 hover:to-orange-700 shadow-lg transition-all duration-300"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>

      {/* Large Hover Preview - Desktop Only */}
      {isHovered && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden lg:flex items-center justify-center p-8">
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-3/4 flex overflow-hidden border border-amber-200"
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsHovered(false)}
              className="absolute top-6 right-6 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>

            {/* Image Section */}
            <div className="flex-1 relative bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center p-8">
                <Image
                  src={productImages[currentImageIndex] || "/placeholder.svg"}
                  alt={product.name}
                  width={500}
                  height={500}
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-lg"
                />

                {/* Image Navigation */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>

                {/* Image Indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {productImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setCurrentImageIndex(index)
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentImageIndex ? "bg-amber-600" : "bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="flex-1 p-8 flex flex-col justify-between bg-gradient-to-b from-white to-amber-50/30">
              <div>
                <div className="flex items-center mb-4">
                  <Crown className="h-6 w-6 text-amber-500 mr-2" />
                  <span className="text-sm text-amber-600 font-medium">Heritage Collection</span>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h2>

                <div className="flex items-center space-x-4 mb-6">
                  <span className="text-4xl font-bold text-amber-600">₹{product.price.toLocaleString("en-IN")}</span>
                  {product.original_price && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        ₹{product.original_price.toLocaleString("en-IN")}
                      </span>
                      <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                        {discountPercentage}% OFF
                      </Badge>
                    </>
                  )}
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700 leading-relaxed">{product.description}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Heritage Promise</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                        <span>35+ years of craftsmanship excellence</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                        <span>Premium quality fabrics and materials</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                        <span>Handpicked by fashion experts</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                        <span>Trusted by 10,000+ families</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 hover:from-amber-700 hover:via-yellow-700 hover:to-orange-700 text-white py-4 text-lg font-semibold shadow-lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>

                <Link href={`/products/${product.id}`}>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-amber-300 text-amber-700 hover:bg-amber-50 py-4 text-lg font-semibold bg-transparent"
                  >
                    View Full Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
