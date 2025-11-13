"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Verified, Calendar } from "lucide-react"
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

interface ReviewCardCompactProps {
  review: Review
  showProductInfo?: boolean
  productName?: string
  productImage?: string
}

export function ReviewCardCompact({ review, showProductInfo, productName, productImage }: ReviewCardCompactProps) {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Product Info (if shown) */}
          {showProductInfo && productName && (
            <div className="flex items-center space-x-3 pb-2 border-b">
              {productImage && (
                <div className="w-10 h-10 rounded overflow-hidden bg-gray-100">
                  <Image
                    src={productImage || "/placeholder.svg"}
                    alt={productName}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <span className="font-medium text-sm">{productName}</span>
            </div>
          )}

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm">{review.user_name || "Anonymous"}</span>
              {review.is_verified && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  <Verified className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              {format(new Date(review.created_at), "MMM dd")}
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                />
              ))}
            </div>
            <span className="text-xs font-medium">{review.rating}/5</span>
          </div>

          {/* Title */}
          <h4 className="font-medium text-sm">{review.title}</h4>

          {/* Comment (truncated) */}
          <p className="text-xs text-gray-600 line-clamp-2">{review.comment}</p>

          {/* Images (if any) */}
          {review.images && review.images.length > 0 && (
            <div className="flex space-x-1">
              {review.images.slice(0, 3).map((imageUrl, index) => (
                <div key={index} className="w-8 h-8 rounded overflow-hidden bg-gray-100">
                  {imageUrl ? (
                    <Image
                      src={imageUrl || "/placeholder.svg"}
                      alt={`Review image ${index + 1}`}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      unoptimized={imageUrl.startsWith("data:")}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>
              ))}
              {review.images.length > 3 && (
                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{review.images.length - 3}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
