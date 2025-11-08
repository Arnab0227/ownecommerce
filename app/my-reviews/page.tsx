"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Calendar, Package, ImageIcon, ThumbsUp } from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"

interface UserReview {
  id: number
  product_id: number
  product_name: string
  product_image: string
  rating: number
  title: string
  comment: string
  images: string[]
  is_verified: boolean
  helpful_count: number
  created_at: string
}

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<UserReview[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndFetchReviews()
  }, [])

  const checkAuthAndFetchReviews = async () => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      setIsAuthenticated(false)
      setLoading(false)
      return
    }

    setIsAuthenticated(true)
    await fetchUserReviews()
  }

  const fetchUserReviews = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch("/api/reviews/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      } else if (response.status === 401) {
        setIsAuthenticated(false)
        localStorage.removeItem("authToken")
      } else {
        toast({
          title: "Error",
          description: "Failed to load your reviews.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching user reviews:", error)
      toast({
        title: "Error",
        description: "Failed to load your reviews.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewProduct = (productId: number) => {
    router.push(`/products/${productId}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 animate-pulse rounded w-1/3"></div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={`my-reviews-loading-${i}`} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  <div className="w-20 h-20 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <Package className="h-16 w-16 text-gray-300 mx-auto" />
              <h2 className="text-xl font-semibold">Login Required</h2>
              <p className="text-gray-600">Please log in to view your reviews.</p>
              <Button onClick={() => router.push("/auth")} className="w-full">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Reviews</h1>
          <Badge variant="secondary" className="text-sm">
            {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <Star className="h-16 w-16 text-gray-300 mx-auto" />
                <h2 className="text-xl font-semibold">No Reviews Yet</h2>
                <p className="text-gray-600">
                  You haven't written any reviews yet. Start shopping and share your experience!
                </p>
                <Button onClick={() => router.push("/")} className="mt-4">
                  Start Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex space-x-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={review.product_image || "/placeholder.svg?height=80&width=80"}
                          alt={review.product_name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3
                            className="font-semibold text-lg hover:text-blue-600 cursor-pointer"
                            onClick={() => handleViewProduct(review.product_id)}
                          >
                            {review.product_name}
                          </h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={`my-review-${review.id}-star-${i}`}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">{review.rating}/5</span>
                            {review.is_verified && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                Verified Purchase
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(review.created_at), "MMM dd, yyyy")}
                        </div>
                      </div>

                      {/* Review Title */}
                      <h4 className="font-medium text-gray-900">{review.title}</h4>

                      {/* Review Comment */}
                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>

                      {/* Review Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <ImageIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {review.images.length} photo{review.images.length > 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {review.images.slice(0, 4).map((imageUrl, index) => (
                              <div
                                key={`my-review-${review.id}-img-${index}`}
                                className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                              >
                                <Image
                                  src={imageUrl || "/placeholder.svg"}
                                  alt={`Review image ${index + 1}`}
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{review.helpful_count} people found this helpful</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProduct(review.product_id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          View Product
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
