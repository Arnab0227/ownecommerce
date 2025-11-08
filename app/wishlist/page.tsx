"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-firebase-auth"
import { useToast } from "@/hooks/use-toast"
import { Heart, ShoppingCart, Trash2, Loader2, AlertCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface WishlistItem {
  id: number
  name: string
  price: number
  image_url: string
  added_at: string
  stock: number
  is_active: boolean
}

export default function WishlistPage() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingItems, setRemovingItems] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!loading && user) {
      loadWishlist()
    } else if (!loading) {
      setIsLoading(false)
    }
  }, [loading, user])

  const loadWishlist = async () => {
    try {
      setIsLoading(true)
      const token = await user?.getIdToken()

      const response = await fetch(`/api/wishlist?userId=${user?.uid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to load wishlist")
      }

      const data = await response.json()
      setWishlistItems(data.wishlist || [])
    } catch (error) {
      console.error("Error loading wishlist:", error)
      toast({
        title: "Error",
        description: "Failed to load wishlist items",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromWishlist = async (productId: number) => {
    try {
      setRemovingItems((prev) => new Set(prev).add(productId))
      const token = await user?.getIdToken()

      const response = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user?.uid, productId }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove item")
      }

      setWishlistItems((prev) => prev.filter((item) => item.id !== productId))
      toast({
        title: "Success",
        description: "Item removed from wishlist",
      })
    } catch (error) {
      console.error("Error removing from wishlist:", error)
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist",
        variant: "destructive",
      })
    } finally {
      setRemovingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const addToCart = async (productId: number) => {
    try {
      const token = await user?.getIdToken()

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      })

      if (!response.ok) {
        throw new Error("Failed to add to cart")
      }

      toast({
        title: "Success",
        description: "Item added to cart",
      })
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      })
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
              <p className="text-gray-600 mb-4">Please sign in to view your wishlist.</p>
              <Button asChild>
                <Link href="/auth">Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-amber-800 mb-2">My Wishlist</h1>
          <p className="text-gray-600">Items you've saved for later</p>
        </div>

        {wishlistItems.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
              <p className="text-gray-600 mb-6">Start adding items you love to your wishlist</p>
              <Button asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <div className="relative aspect-square overflow-hidden rounded-t-lg">
                    <Image
                      src={item.image_url || "/placeholder.svg?height=300&width=300"}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      onClick={() => removeFromWishlist(item.id)}
                      disabled={removingItems.has(item.id)}
                    >
                      {removingItems.has(item.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.name}</h3>
                  <p className="text-2xl font-bold text-amber-600 mb-4">₹{item.price.toLocaleString("en-IN")}</p>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => addToCart(item.id)} disabled={item.stock === 0}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {item.stock === 0 ? "Out of Stock" : "Add to Cart"}
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/products/${item.id}`}>View</Link>
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Added {new Date(item.added_at).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
