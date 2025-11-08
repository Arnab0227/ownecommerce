"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-firebase-auth"
import { CheckCircle, Package, Truck, Clock, Star, Home, Eye, CreditCard, AlertTriangle } from "lucide-react"
import Image from "next/image"
import { formatDateTimeIndia } from "@/utils/date-utils"

interface OrderItem {
  id: string
  product_id: string | number
  product_name: string
  quantity: number
  price: number
  total: number
  product_image?: string
}

interface Order {
  id: string
  order_number?: string
  total_amount: number
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  payment_method: "razorpay" | "cod"
  payment_status: "pending" | "paid" | "failed"
  created_at: string
  shipping_address: {
    name: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
  }
  items: OrderItem[]
  razorpay_order_id?: string
}

export default function OrderStatusPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentRetryLoading, setPaymentRetryLoading] = useState(false)

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided")
      setLoading(false)
      return
    }

    if (!user) {
      router.push("/auth")
      return
    }

    loadOrderDetails()
  }, [orderId, user, router])

  const loadOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (!response.ok) {
        throw new Error("Failed to load order details")
      }

      const data = await response.json()
      setOrder(data.order)
    } catch (err) {
      console.error("Error loading order:", err)
      setError("Failed to load order details")
    } finally {
      setLoading(false)
    }
  }

  const getStatusImage = () => {
    if (!order) return "/waiting.png"

    switch (order.status) {
      case "pending":
        return order.payment_status === "failed" ? "/failed.png" : "/waiting.png"
      case "confirmed":
      case "processing":
        return "/waiting.png"
      case "shipped":
      case "delivered":
        return "/order.png"
      case "cancelled":
        return "/failed.png"
      default:
        return "/waiting.png"
    }
  }

  const getStatusMessage = () => {
    if (!order) return { title: "Processing Order", message: "Please wait while we process your order..." }

    switch (order.status) {
      case "pending":
        if (order.payment_status === "failed") {
          return {
            title: "Payment Failed",
            message:
              "Woof! The payment didn't go through. Don't worry, you can retry payment below and I'll be happy again!",
          }
        }
        return {
          title: "Order Being Confirmed",
          message:
            "Woof woof! I'm patiently waiting while your order gets confirmed. Hold tight while we process and deliver to your doorstep - it will not take long!",
        }
      case "confirmed":
      case "processing":
        return {
          title: "Order Confirmed!",
          message:
            "Woof woof! I'm excited - your order is confirmed and being processed. Hold tight while we get everything ready for delivery!",
        }
      case "shipped":
        return {
          title: "Order Shipped!",
          message:
            "Woof! I'm so happy - your order is on its way! Check the tracking details below for real-time updates.",
        }
      case "delivered":
        return {
          title: "Order Delivered!",
          message:
            "Woof woof! I'm absolutely thrilled - your order has been successfully delivered. Thank you for shopping with us!",
        }
      case "cancelled":
        return {
          title: "Order Cancelled",
          message:
            "Woof... I'm sad that your order couldn't be processed. Please contact support for assistance or try placing a new order to make me happy again!",
        }
      default:
        return {
          title: "Order Received",
          message: "Woof! I've received your order and we're processing it. I'll update you soon!",
        }
    }
  }

  const getStatusColor = () => {
    if (!order) return "bg-yellow-100 text-yellow-800"

    switch (order.status) {
      case "pending":
        return order.payment_status === "failed" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
      case "confirmed":
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleRetryPayment = async () => {
    if (!order || !order.razorpay_order_id) return

    setPaymentRetryLoading(true)
    try {
      // Load Razorpay script if not already loaded
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      document.body.appendChild(script)

      script.onload = async () => {
        // Get Razorpay key
        const configResponse = await fetch("/api/config/razorpay")
        const { keyId } = await configResponse.json()

        const options = {
          key: keyId,
          amount: order.total_amount * 100,
          currency: "INR",
          name: "Suktara",
          description: `Retry Payment for Order #${order.order_number || order.id}`,
          order_id: order.razorpay_order_id,
          handler: async (response: any) => {
            try {
              const verifyResponse = await fetch("/api/payments/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              })

              if (verifyResponse.ok) {
                // Reload order details to show updated status
                await loadOrderDetails()
              }
            } catch (error) {
              console.error("Payment verification error:", error)
            }
          },
          prefill: {
            name: order.shipping_address.name,
            email: user?.email || "",
            contact: order.shipping_address.phone,
          },
          theme: {
            color: "#ea580c",
          },
          modal: {
            ondismiss: () => {
              setPaymentRetryLoading(false)
            },
          },
        }

        const razorpay = new (window as any).Razorpay(options)
        razorpay.open()
      }
    } catch (error) {
      console.error("Error retrying payment:", error)
      setPaymentRetryLoading(false)
    }
  }

  const isPaymentRetryAvailable = () => {
    if (!order || order.payment_status !== "failed" || order.payment_method !== "razorpay") return false

    const orderTime = new Date(order.created_at).getTime()
    const currentTime = new Date().getTime()
    const timeDiff = currentTime - orderTime
    const twentyMinutes = 20 * 60 * 1000 // 20 minutes in milliseconds

    return timeDiff < twentyMinutes
  }

  const loyaltyPointsEarned = order ? Math.round(order.total_amount * 0.02) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <Image src="/failed.png" alt="Order Error" width={150} height={150} className="mx-auto mb-4 rounded-xl" />
              <h2 className="text-xl font-semibold mb-2 text-red-600">Order Not Found</h2>
              <p className="text-gray-600 mb-4">{error || "Unable to load order details"}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => router.push("/orders")} variant="outline">
                  View Orders
                </Button>
                <Button onClick={() => router.push("/")} className="bg-amber-600 hover:bg-amber-700">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusInfo = getStatusMessage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Status Header */}
          <Card className="mb-6 border-amber-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h1 className="text-2xl font-bold text-amber-800 mb-2">{statusInfo.title}</h1>
                  <p className="text-gray-600 leading-relaxed">{statusInfo.message}</p>
                </div>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-lg font-semibold">Order #{order.order_number || `ORD${order.id}`}</span>
                  <Badge className={getStatusColor()}>
                    <span className="capitalize">{order.status}</span>
                  </Badge>
                </div>

                <Image
                  src={getStatusImage() || "/placeholder.svg"}
                  alt="Order Status"
                  width={180}
                  height={180}
                  className="mx-auto mb-4 rounded-xl shadow-md"
                />

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    ₹{order.total_amount.toLocaleString("en-IN")}
                  </div>
                  <div className="text-sm text-green-600">
                    <Star className="h-3 w-3 inline mr-1" />
                    {loyaltyPointsEarned} loyalty points earned
                  </div>
                </div>

                {order.payment_status === "failed" && isPaymentRetryAvailable() && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <h3 className="font-semibold text-red-800">Payment Failed</h3>
                    </div>
                    <p className="text-sm text-red-700 mb-3">
                      Don't worry! You can retry your payment within the next few minutes.
                    </p>
                    <Button
                      onClick={handleRetryPayment}
                      disabled={paymentRetryLoading}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {paymentRetryLoading ? "Processing..." : "Retry Payment"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Order Items */}
                <div>
                  <h4 className="font-medium mb-3">Items ({order.items?.length || 0})</h4>
                  <div className="space-y-3">
                    {order.items?.map((item, index) => (
                      <div key={`${item.id}-${index}`} className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg">
                        <Image
                          src={item.product_image || "/placeholder.svg?height=80&width=80"}
                          alt={item.product_name}
                          width={80}
                          height={80}
                          className="rounded-xl object-cover cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                          onClick={() => item.product_id && router.push(`/products/${item.product_id}`)}
                        />
                        <div className="flex-1">
                          <h5
                            className="font-medium cursor-pointer hover:text-amber-600 transition-colors"
                            onClick={() => item.product_id && router.push(`/products/${item.product_id}`)}
                          >
                            {item.product_name}
                          </h5>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity} × ₹{item.price.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{item.total.toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    )) || <p className="text-gray-500">No items found</p>}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Delivery Address</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">{order.shipping_address.name}</p>
                    <p className="text-sm text-gray-600">{order.shipping_address.phone}</p>
                    <p className="text-sm text-gray-600">{order.shipping_address.address}</p>
                    <p className="text-sm text-gray-600">
                      {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                    </p>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Payment Information</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm">
                      <strong>Method:</strong>{" "}
                      {order.payment_method === "razorpay" ? "Online Payment" : "Cash on Delivery"}
                    </div>
                    <div className="text-sm">
                      <strong>Status:</strong>
                      <Badge
                        className={`ml-2 ${
                          order.payment_status === "paid"
                            ? "bg-green-100 text-green-800"
                            : order.payment_status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.payment_status}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <strong>Order Date:</strong> {formatDateTimeIndia(order.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button onClick={() => router.push("/orders")} className="w-full bg-amber-600 hover:bg-amber-700" size="lg">
              <Eye className="h-4 w-4 mr-2" />
              View All Orders
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => router.push("/")} variant="outline" className="border-amber-200 hover:bg-amber-50">
                <Home className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>

              <Button
                onClick={() => router.push("/orders")}
                variant="outline"
                className="border-amber-200 hover:bg-amber-50"
              >
                <Truck className="h-4 w-4 mr-2" />
                Track Order
              </Button>
            </div>
          </div>

          {/* Next Steps */}
          <Card className="mt-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
            <CardContent className="pt-6">
              <h4 className="font-semibold text-amber-800 mb-3">What happens next?</h4>
              <div className="space-y-2 text-sm text-amber-700">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>We'll process your order within 24 hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>You'll receive a confirmation email with tracking details</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  <span>Estimated delivery: 3-7 business days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
