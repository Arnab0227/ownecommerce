"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, User, Verified, Calendar, ImageIcon } from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"

interface Review {
  id: number
  user_id: string
  rating: number
  title: string
  comment: string
  images: string[]
  is_verified: boolean
  helpful_count: number
  created_at: string
  user_name?: string
}

interface ReviewListProps {
  productId: number
  refreshTrigger?: number
}

export function ReviewList({ productId, refreshTrigger }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest")
  const [expandedImages, setExpandedImages] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    setLoading(true)
    fetchReviews()
  }, [productId, refreshTrigger, sortBy])

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?productId=${productId}&sortBy=${sortBy}`)
      if (response.ok) {
        const data = await response.json()
        const list: Review[] = data.reviews || []
        console.log(
          "[v0] ReviewList fetched reviews:",
          list.map((r) => ({ id: r.id, rating: r.rating, user_name: r.user_name })),
        )
        setReviews(list)
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleImageExpansion = (reviewId: number) => {
    setExpandedImages((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }))
  }

  const makeReviewKey = (r: Review, idx: number) => {
    if (r?.id !== undefined && r?.id !== null) {
      return `review-${productId}-${r.id}`
    }
    return `review-${productId}-unknown-${idx}`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={`review-loading-skeleton-${productId}-${i}`} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-3">
            <Star className="h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">No reviews yet</h3>
            <p className="text-gray-600">Be the first to review this product!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Customer Reviews ({reviews.length})</h3>
        <select
          title="Sort reviews"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
        </select>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {reviews.map((review, idx) => {
          const reviewKey = makeReviewKey(review, idx)

          return (
            <Card key={reviewKey} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">{review.user_name || "Anonymous User"}</span>
                        {review.is_verified && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            <Verified className="h-3 w-3 mr-1" />
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(review.created_at), "MMM dd, yyyy")}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={`star-${review.id}-${i}`}
                            className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{review.rating}/5</span>
                    </div>

                    {/* Title */}
                    <h4 className="font-semibold text-gray-900">{review.title}</h4>

                    {/* Comment */}
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>

                    {/* Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <ImageIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {review.images.length} photo{review.images.length > 1 ? "s" : ""}
                          </span>
                        </div>

                        {(() => {
                          const expKey = `${reviewKey}-expanded`
                          const isExpanded = Boolean(expandedImages[expKey])
                          return (
                            <>
                              <div
                                className={`grid gap-2 ${isExpanded ? "grid-cols-2 md:grid-cols-3" : "grid-cols-4"}`}
                              >
                                {review.images?.slice(0, isExpanded ? undefined : 4).map((imageUrl, imageIdx) => (
                                  <div
                                    key={`img-${review.id}-${imageIdx}`}
                                    className="relative rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity aspect-square"
                                    onClick={() => toggleImageExpansion(review.id)}
                                  >
                                    {imageUrl ? (
                                      <Image
                                        src={imageUrl || "/placeholder.svg"}
                                        alt={`Review image ${imageIdx + 1}`}
                                        fill
                                        className="object-cover"
                                        unoptimized={imageUrl.startsWith("data:")}
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gray-200" />
                                    )}
                                  </div>
                                ))}
                                {!isExpanded && review.images.length > 4 && (
                                  <div
                                    className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                                    onClick={() => toggleImageExpansion(review.id)}
                                  >
                                    <span className="text-sm font-medium text-gray-600">
                                      +{review.images.length - 4} more
                                    </span>
                                  </div>
                                )}
                              </div>

                              {review.images.length > 4 && (
                                <button
                                  onClick={() => toggleImageExpansion(review.id)}
                                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                >
                                  {isExpanded ? "Show less" : `View all ${review.images.length} photos`}
                                </button>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
