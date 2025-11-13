"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, ShoppingCart, Heart, Truck, Shield, RotateCcw, Minus, Plus } from "lucide-react"
import { useCart, type Product } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-firebase-auth"
import { toast } from "@/hooks/use-toast"
import { ReviewList } from "@/components/reviews/review-list"
import { ReviewForm } from "@/components/reviews/review-form"
import { ReviewSummary } from "@/components/reviews/review-summary"
import { BuyItAgain } from "@/components/buy-it-again"
import { RecentlyViewed } from "@/components/recently-viewed"

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [canReview, setCanReview] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [refreshReviews, setRefreshReviews] = useState(0)
  const { addItem } = useCart()

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
      addToRecentlyViewed(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    if (user && product) {
      checkReviewEligibility()
    }
  }, [user, product])

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

  const addToRecentlyViewed = async (productId: string) => {
    try {
      const sessionId = sessionStorage.getItem("sessionId") || `session_${Date.now()}_${Math.random()}`
      if (!sessionStorage.getItem("sessionId")) {
        sessionStorage.setItem("sessionId", sessionId)
      }

      console.log("[v0] Adding to recently viewed:", productId, "userId:", user?.uid, "sessionId:", sessionId)
      const response = await fetch("/api/recently-viewed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: Number(productId),
          userId: user?.uid,
          sessionId,
        }),
      })

      const data = await response.json()
      console.log("[v0] Recently viewed response:", data)

      window.dispatchEvent(new Event("product-viewed"))
      window.dispatchEvent(new Event("storage"))
    } catch (error) {
      console.error("[v0] Error adding to recently viewed:", error)
    }
  }

  const checkReviewEligibility = async () => {
    if (!user || !product) return

    try {
      const response = await fetch(`/api/reviews/eligibility?productId=${product.id}`, {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCanReview(data.canReview)
        setHasReviewed(data.hasReviewed)
      }
    } catch (error) {
      console.error("Error checking review eligibility:", error)
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
      if (!user) {
        const { addPurchase } = require("@/lib/local-storage-purchases")
        addPurchase({
          id: product.id,
          name: product.name,
          price: product.price,
          original_price: product.original_price,
          imageUrl: product.imageUrl,
          category: product.category,
        })
      }
      router.push("/cart")
    }
  }

  const handleReviewSubmitted = () => {
    setShowReviewForm(false)
    setRefreshReviews((prev) => prev + 1)
    setHasReviewed(true)
    toast({
      title: "Review submitted",
      description: "Thank you for your review!",
    })
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
      <div className="grid md:grid-cols-2 gap-8 mb-12">
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
            {product.model_no && <p className="text-sm text-gray-600 mb-2">Model: {product.model_no}</p>}
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
                You save ₹{((product.original_price || 0) - product.price).toLocaleString("en-IN")} (
                {discountPercentage}% off)
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
              <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}>
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

      <Separator className="my-8" />

      <div className="mb-8">
            <RecentlyViewed />
          </div>

      <Separator className="my-8" />
      
      <div className="mb-12">
        <BuyItAgain />
      </div>

      <Separator className="my-8" />

      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="write-review">Write Review</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-6">
          <div className="space-y-6">
            <ReviewSummary productId={Number(product.id)} refreshTrigger={refreshReviews} />
            <ReviewList productId={Number(product.id)} refreshTrigger={refreshReviews} />
          </div>
        </TabsContent>

        <TabsContent value="write-review" className="mt-6">
          {!user ? (
            <Card className="p-6 text-center">
              <p className="text-gray-600 mb-4">Please sign in to write a review</p>
              <Button onClick={() => router.push("/auth")} className="bg-orange-600 hover:bg-orange-700">
                Sign In
              </Button>
            </Card>
          ) : hasReviewed ? (
            <Card className="p-6 text-center">
              <p className="text-gray-600">You have already reviewed this product</p>
            </Card>
          ) : !canReview ? (
            <Card className="p-6 text-center">
              <p className="text-gray-600 mb-2">You can only review products you have purchased and received</p>
              <p className="text-sm text-gray-500">Your review will be marked as verified purchase</p>
            </Card>
          ) : (
            <ReviewForm productId={Number(product.id)} onReviewSubmitted={handleReviewSubmitted} onCancel={() => {}} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
