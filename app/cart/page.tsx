"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-firebase-auth"
import { toast } from "@/hooks/use-toast"

export default function CartPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, updateQuantity, removeItem, getTotal, isLoaded } = useCart()
  const [loading, setLoading] = useState(false)

  const subtotal = getTotal()
  const deliveryFee = subtotal >= 699 ? 0 : 70
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

  const handleProceedToCheckout = () => {
    if (!user) {
      // Store the intent to checkout in localStorage
      localStorage.setItem("checkout-redirect", "true")
      toast({
        title: "Please sign in",
        description: "You need to sign in to proceed to checkout.",
      })
      router.push("/auth")
    } else {
      router.push("/checkout")
    }
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
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Cart Items ({items.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-3 md:p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                    <Image
                      src={item.imageUrl || "/placeholder.svg?height=80&width=80"}
                      alt={item.name}
                      width={60}
                      height={60}
                      className="sm:w-20 sm:h-20 rounded-md flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base line-clamp-2">{item.name}</h3>
                      <p className="text-xs md:text-sm text-gray-600 line-clamp-1 md:line-clamp-2">
                        {item.description}
                      </p>
                      {item.model_no && <p className="text-xs text-gray-500">Model: {item.model_no}</p>}
                      <div className="flex items-center space-x-2 mt-1 md:mt-2">
                        <span className="font-bold text-green-600 text-sm md:text-base">
                          ₹{item.price.toLocaleString("en-IN")}
                        </span>
                        {item.original_price && item.original_price > item.price && (
                          <span className="text-xs md:text-sm text-gray-500 line-through">
                            ₹{item.original_price.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto sm:flex-col sm:items-end space-y-2 sm:space-y-3">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="px-2 py-1 border rounded text-center min-w-[2.5rem] text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-bold text-sm md:text-base">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id, item.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm md:text-base">
                  <span>Subtotal ({items.reduce((count, item) => count + item.quantity, 0)} items)</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between text-sm md:text-base">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? "text-green-600" : ""}>
                    {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                  </span>
                </div>

                {subtotal < 699 && (
                  <div className="text-xs md:text-sm text-orange-600 bg-orange-50 p-2 rounded">
                    Add ₹{(699 - subtotal).toLocaleString("en-IN")} more for free delivery!
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-base md:text-lg">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleProceedToCheckout}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-sm md:text-base py-2 md:py-3"
                  disabled={loading}
                >
                  Proceed to Checkout
                </Button>
                <Link href="/">
                  <Button variant="outline" className="w-full text-sm md:text-base py-2 md:py-3 bg-transparent">
                    Continue Shopping
                  </Button>
                </Link>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>• Free delivery on orders above ₹699</p>
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
