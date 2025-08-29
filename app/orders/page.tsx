"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-firebase-auth"
import { useToast } from "@/hooks/use-toast"
import { Package, Truck, CheckCircle, Clock, MapPin, Star, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InvoiceGenerator } from "@/components/invoice-generator"

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
  adminNotes?: string
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

  type DbOrderRow = {
    id: number | string
    order_number?: string
    created_at: string
    order_status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "confirmed"
    total_amount: string | number
    delivery_fee?: string | number | null
    shipping_address?: {
      name?: string
      address?: string
      city?: string
      state?: string
      pincode?: string
    } | null
    tracking_number?: string | null
  }

  type DbOrderDetails = {
    order: {
      id: number | string
      tracking_number?: string | null
      admin_notes?: string | null
      items: Array<{
        product_id: string | number
        product_name: string | null
        product_image?: string | null
        quantity: number
        price: number
        total: number
      }>
    }
  }

  const loadOrders = async () => {
    try {
      const response = await fetch(`/api/orders?userId=${user?.uid}`)
      if (!response.ok) throw new Error("failed")

      const rows: DbOrderRow[] = await response.json()

      const mapped = await Promise.all(
        rows.map(async (row) => {
          const detailsRes = await fetch(`/api/orders/${row.id}`)
          let details: DbOrderDetails | null = null
          if (detailsRes.ok) {
            details = await detailsRes.json()
          }

          const items =
            details?.order.items?.map((it, idx) => ({
              id: `${row.id}-${it.product_id}-${idx}`,
              name: it.product_name || `Product ${it.product_id}`,
              price: Number(it.price || 0),
              quantity: Number(it.quantity || 0),
              image: it.product_image || "/placeholder.svg?height=80&width=80",
            })) || []

          const shipping = row.shipping_address || {}

          const uiOrder: Order & { adminNotes?: string } = {
            id: String(row.id),
            orderNumber: row.order_number || String(row.id),
            date: row.created_at,
            status: (row.order_status === "confirmed" ? "processing" : row.order_status) as Order["status"],
            items,
            totalAmount: Number(row.total_amount ?? 0),
            loyaltyPointsEarned: Math.round(Number(row.total_amount ?? 0) * 0.015),
            shippingAddress: {
              name: shipping?.name || "N/A",
              street: shipping?.address || "N/A",
              city: shipping?.city || "N/A",
              state: shipping?.state || "N/A",
              pincode: shipping?.pincode || "N/A",
            },
            trackingNumber: details?.order?.tracking_number || row.tracking_number || undefined,
          }
          ;(uiOrder as any).adminNotes = details?.order?.admin_notes || null
          return uiOrder
        }),
      )

      setOrders(mapped)
    } catch (e) {
      console.error("Error loading orders:", e)
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

                        {/* Seller Notes */}
                        {(order as any).adminNotes ? (
                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-2">Seller Notes</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{(order as any).adminNotes}</p>
                          </div>
                        ) : null}

                        <div className="flex gap-2 pt-4">
                          <Button variant="outline" size="sm">
                            Track Order
                          </Button>
                          <Button variant="outline" size="sm">
                            Contact Support
                          </Button>
                          {order.status === "pending" && (
                            <Button variant="outline" size="sm">
                              Retry Payment
                            </Button>
                          )}
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

                        {/* Seller Notes */}
                        {(order as any).adminNotes ? (
                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-2">Seller Notes</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{(order as any).adminNotes}</p>
                          </div>
                        ) : null}

                        <div className="flex gap-2 pt-4">
                          <Button variant="outline" size="sm">
                            Reorder
                          </Button>
                          <Button variant="outline" size="sm">
                            Write Review
                          </Button>
                          <InvoiceGenerator orderId={order.id} orderStatus={order.status} />
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
