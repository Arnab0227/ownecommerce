"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-firebase-auth"
import { useToast } from "@/hooks/use-toast"
import { Package, Truck, CheckCircle, Clock, MapPin, Star, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

interface Order {
  id: string
  orderNumber: string
  date: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  items: OrderItem[]
  totalAmount: number
  loyaltyPointsEarned: number
  shippingAddress: {
    name: string
    street: string
    city: string
    state: string
    pincode: string
  }
  estimatedDelivery?: string
  trackingNumber?: string
}

export default function OrdersPage() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadOrders()
    } else if (!loading) {
      setIsLoading(false)
    }
  }, [user, loading])

  const loadOrders = async () => {
    try {
      // Mock orders data - in real app, fetch from API
      const mockOrders: Order[] = [
        {
          id: "1",
          orderNumber: "GT-2024-001",
          date: "2024-01-15",
          status: "delivered",
          items: [
            {
              id: "1",
              name: "Elegant Silk Dress",
              price: 2999,
              quantity: 1,
              image: "/placeholder.svg?height=80&width=80",
            },
            {
              id: "2",
              name: "Cotton Kids T-Shirt",
              price: 599,
              quantity: 2,
              image: "/placeholder.svg?height=80&width=80",
            },
          ],
          totalAmount: 4197,
          loyaltyPointsEarned: Math.round(4197 * 0.015), // 1.5% of order value
          shippingAddress: {
            name: "John Doe",
            street: "123 Main Street, Apartment 4B",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
          },
          trackingNumber: "GT123456789",
        },
        {
          id: "2",
          orderNumber: "GT-2024-002",
          date: "2024-01-20",
          status: "shipped",
          items: [
            {
              id: "3",
              name: "Designer Handbag",
              price: 1999,
              quantity: 1,
              image: "/placeholder.svg?height=80&width=80",
            },
          ],
          totalAmount: 2199,
          loyaltyPointsEarned: Math.round(2199 * 0.015),
          shippingAddress: {
            name: "John Doe",
            street: "123 Main Street, Apartment 4B",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
          },
          estimatedDelivery: "2024-01-25",
          trackingNumber: "GT987654321",
        },
        {
          id: "3",
          orderNumber: "GT-2024-003",
          date: "2024-01-22",
          status: "processing",
          items: [
            {
              id: "4",
              name: "Kids Summer Dress",
              price: 899,
              quantity: 1,
              image: "/placeholder.svg?height=80&width=80",
            },
          ],
          totalAmount: 1099,
          loyaltyPointsEarned: Math.round(1099 * 0.015),
          shippingAddress: {
            name: "John Doe",
            street: "456 Business Park, Floor 5",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400002",
          },
          estimatedDelivery: "2024-01-28",
        },
      ]

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setOrders(mockOrders)
    } catch (error) {
      console.error("Error loading orders:", error)
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
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

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "processing":
        return <Package className="h-4 w-4" />
      case "shipped":
        return <Truck className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const currentOrders = orders.filter((order) => ["pending", "processing", "shipped"].includes(order.status))
  const previousOrders = orders.filter((order) => ["delivered", "cancelled"].includes(order.status))

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
              <p className="text-gray-600 mb-4">You need to be signed in to view your orders.</p>
              <Button onClick={() => (window.location.href = "/auth")}>Sign In</Button>
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
          <h1 className="text-3xl font-bold text-amber-800 mb-2">My Orders</h1>
          <p className="text-gray-600">Track your orders and view purchase history</p>
        </div>

        <Tabs defaultValue="current" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Current Orders ({currentOrders.length})</TabsTrigger>
            <TabsTrigger value="previous">Previous Orders ({previousOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            {currentOrders.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Current Orders</h3>
                    <p className="text-gray-600 mb-4">You don't have any ongoing orders at the moment.</p>
                    <Button onClick={() => (window.location.href = "/")}>Start Shopping</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {currentOrders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            Order #{order.orderNumber}
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1 capitalize">{order.status}</span>
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            Placed on {new Date(order.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{order.totalAmount.toLocaleString("en-IN")}</p>
                          <p className="text-sm text-green-600">
                            <Star className="h-3 w-3 inline mr-1" />
                            {order.loyaltyPointsEarned} points earned
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Order Items */}
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-4">
                              <img
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium">{item.name}</h4>
                                <p className="text-sm text-gray-600">
                                  Quantity: {item.quantity} × ₹{item.price}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Shipping Address */}
                        <div className="border-t pt-4">
                          <h4 className="font-medium flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4" />
                            Shipping Address
                          </h4>
                          <p className="text-sm text-gray-600">
                            {order.shippingAddress.name}
                            <br />
                            {order.shippingAddress.street}
                            <br />
                            {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                            {order.shippingAddress.pincode}
                          </p>
                        </div>

                        {/* Tracking Info */}
                        {order.trackingNumber && (
                          <div className="border-t pt-4">
                            <h4 className="font-medium flex items-center gap-2 mb-2">
                              <Truck className="h-4 w-4" />
                              Tracking Information
                            </h4>
                            <p className="text-sm text-gray-600">
                              Tracking Number: <span className="font-mono">{order.trackingNumber}</span>
                            </p>
                            {order.estimatedDelivery && (
                              <p className="text-sm text-gray-600">
                                Estimated Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 pt-4">
                          <Button variant="outline" size="sm">
                            Track Order
                          </Button>
                          <Button variant="outline" size="sm">
                            Contact Support
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="previous">
            {previousOrders.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Previous Orders</h3>
                    <p className="text-gray-600 mb-4">You haven't completed any orders yet.</p>
                    <Button onClick={() => (window.location.href = "/")}>Start Shopping</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {previousOrders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            Order #{order.orderNumber}
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1 capitalize">{order.status}</span>
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {order.status === "delivered" ? "Delivered" : "Placed"} on{" "}
                            {new Date(order.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{order.totalAmount.toLocaleString("en-IN")}</p>
                          <p className="text-sm text-green-600">
                            <Star className="h-3 w-3 inline mr-1" />
                            {order.loyaltyPointsEarned} points earned
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Order Items */}
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-4">
                              <img
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium">{item.name}</h4>
                                <p className="text-sm text-gray-600">
                                  Quantity: {item.quantity} × ₹{item.price}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button variant="outline" size="sm">
                            Reorder
                          </Button>
                          <Button variant="outline" size="sm">
                            Write Review
                          </Button>
                          <Button variant="outline" size="sm">
                            Download Invoice
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
