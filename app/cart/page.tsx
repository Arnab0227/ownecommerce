"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from "@/hooks/use-cart"
import { toast } from "@/hooks/use-toast"

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotal, isLoaded } = useCart()
  const [loading, setLoading] = useState(false)

  const subtotal = getTotal()
  const deliveryFee = subtotal >= 799 ? 0 : 79
  const total = subtotal + deliveryFee

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(productId)
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      })
    } else {
      updateQuantity(productId, newQuantity)
    }
  }

  const handleRemoveItem = (productId: string, productName: string) => {
    removeItem(productId)
    toast({
      title: "Item removed",
      description: `${productName} has been removed from your cart.`,
    })
  }

  // Show loading state while cart is being loaded
  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading cart...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
        <Link href="/">
          <Button className="bg-orange-600 hover:bg-orange-700">Continue Shopping</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Cart Items ({items.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Image
                    src={item.imageUrl || "/placeholder.svg?height=80&width=80"}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="rounded-md"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                    {item.model_no && (
                      <p className="text-xs text-gray-500">Model: {item.model_no}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="font-bold text-green-600">₹{item.price.toLocaleString("en-IN")}</span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-sm text-gray-500 line-through">
                          ₹{item.originalPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="px-3 py-1 border rounded text-center min-w-[3rem]">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <div className="font-bold">₹{(item.price * item.quantity).toLocaleString("en-IN")}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id, item.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal ({items.reduce((count, item) => count + item.quantity, 0)} items)</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? "text-green-600" : ""}>
                    {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                  </span>
                </div>

                {subtotal < 799 && (
                  <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                    Add ₹{(799 - subtotal).toLocaleString("en-IN")} more for free delivery!
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>

              <div className="space-y-2">
                <Link href="/checkout">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
                    Proceed to Checkout
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>• Free delivery on orders above ₹799</p>
                <p>• Cash on Delivery available</p>
                <p>• Easy returns within 7 days</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
