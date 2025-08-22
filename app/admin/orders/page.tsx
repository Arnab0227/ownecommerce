"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-firebase-auth"
import { useToast } from "@/hooks/use-toast"
import {
  Package,
  Search,
  Calendar,
  User,
  MapPin,
  DollarSign,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  Edit,
  CreditCard,
  Smartphone,
  Banknote,
  Globe,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  price: number
  total: number
  product_name?: string
  product_image?: string
}

interface Order {
  id: string
  user_id: string
  user_email: string
  total_amount: number
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  payment_method: "razorpay" | "cod"
  payment_status: "pending" | "paid" | "failed"
  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
  shipping_address: {
    name: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
  }
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export default function AdminOrdersPage() {
  const { user, isAdmin, loading } = useAuth()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [timeFilter, setTimeFilter] = useState<string>("all")

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadOrders()
    } else if (!loading) {
      setIsLoading(false)
    }
  }, [loading, user, isAdmin])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, statusFilter, timeFilter])

  const loadOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders")
      if (response.ok) {
        const ordersData = await response.json()

        const ordersWithItems = await Promise.all(
          ordersData.map(async (order: Order) => {
            try {
              const itemsResponse = await fetch(`/api/orders/${order.id}`)
              if (itemsResponse.ok) {
                const orderDetails = await itemsResponse.json()
                return {
                  ...order,
                  items: orderDetails.order?.items || [],
                }
              }
              return order
            } catch (error) {
              console.error(`Error fetching items for order ${order.id}:`, error)
              return order
            }
          }),
        )

        setOrders(ordersWithItems)
      } else {
        throw new Error("Failed to fetch orders")
      }
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

  const filterOrders = () => {
    let filtered = [...orders]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.razorpay_order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.razorpay_payment_id?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Time filter
    if (timeFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (timeFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1)
          break
      }

      filtered = filtered.filter((order) => new Date(order.created_at) >= filterDate)
    }

    setFilteredOrders(filtered)
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const trackingNumber =
        newStatus === "shipped" ? `TRK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}` : undefined

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          tracking_number: trackingNumber,
          send_notification: true,
        }),
      })

      if (response.ok) {
        setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
        toast({
          title: "Success",
          description: `Order status updated to ${newStatus}${trackingNumber ? ` with tracking number ${trackingNumber}` : ""}. Customer notification sent.`,
        })
      } else {
        throw new Error("Failed to update order status")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-indigo-100 text-indigo-800"
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
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />
      case "processing":
        return <Package className="h-4 w-4" />
      case "shipped":
        return <Truck className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "razorpay":
        return <CreditCard className="h-4 w-4" />
      case "cod":
        return <Banknote className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "razorpay":
        return "Online Payment"
      case "cod":
        return "Cash on Delivery"
      default:
        return method
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      processing: orders.filter((o) => o.status === "processing").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
      totalRevenue: orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total_amount, 0),
    }
    return stats
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
              <Button onClick={() => (window.location.href = "/admin")}>Go to Admin</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = getOrderStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-800 mb-2">Order Management</h1>
          <p className="text-gray-600">
            Comprehensive order tracking with payment details, customer information, and transaction history
          </p>
        </div>

        {/* Order Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
                <div className="text-sm text-gray-600">Confirmed</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{stats.processing}</div>
                <div className="text-sm text-gray-600">Processing</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.shipped}</div>
                <div className="text-sm text-gray-600">Shipped</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
                <div className="text-sm text-gray-600">Delivered</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
                <div className="text-sm text-gray-600">Cancelled</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">₹{stats.totalRevenue.toLocaleString("en-IN")}</div>
                <div className="text-sm text-gray-600">Revenue</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by order ID, customer email, transaction ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
                  <p className="text-gray-600">No orders match your current filters.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Order #{order.id}
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </Badge>
                        <Badge className={getPaymentStatusColor(order.payment_status)}>
                          <span className="capitalize">{order.payment_status}</span>
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {order.user_email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.created_at).toLocaleDateString("en-IN")}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />₹{order.total_amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value as Order["status"])}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-medium mb-3">Items ({order.items?.length || 0})</h4>
                      <div className="space-y-2">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <img
                              src={item.product_image || "/placeholder.svg?height=48&width=48"}
                              alt={item.product_name || "Product"}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.product_name || `Product ${item.product_id}`}</p>
                              <p className="text-xs text-gray-600">
                                {item.quantity} × ₹{(item.price || 0).toLocaleString("en-IN")} = ₹
                                {(item.total || 0).toLocaleString("en-IN")}
                              </p>
                            </div>
                          </div>
                        )) || <p className="text-sm text-gray-500">No items loaded</p>}
                      </div>
                    </div>

                    {/* Customer & Shipping */}
                    <div>
                      <h4 className="font-medium mb-3">Customer & Shipping</h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Email:</strong> {order.user_email}
                        </p>
                        <p>
                          <strong>User ID:</strong> {order.user_id}
                        </p>
                        <div className="pt-2">
                          <p className="font-medium flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            Shipping Address
                          </p>
                          <div className="text-gray-600 ml-5">
                            <p>{order.shipping_address.name}</p>
                            <p>{order.shipping_address.address}</p>
                            <p>
                              {order.shipping_address.city}, {order.shipping_address.state}
                            </p>
                            <p>{order.shipping_address.pincode}</p>
                            <p>{order.shipping_address.phone}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div>
                      <h4 className="font-medium mb-3">Payment Details</h4>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2">
                          {getPaymentMethodIcon(order.payment_method)}
                          <strong>Method:</strong> {getPaymentMethodLabel(order.payment_method)}
                        </p>
                        <p>
                          <strong>Status:</strong>
                          <Badge className={`ml-2 ${getPaymentStatusColor(order.payment_status)}`}>
                            {order.payment_status}
                          </Badge>
                        </p>
                        {order.razorpay_order_id && (
                          <div>
                            <p>
                              <strong>Razorpay Order ID:</strong>
                            </p>
                            <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded break-all">
                              {order.razorpay_order_id}
                            </p>
                          </div>
                        )}
                        {order.razorpay_payment_id && (
                          <div>
                            <p>
                              <strong>Transaction ID:</strong>
                            </p>
                            <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded break-all">
                              {order.razorpay_payment_id}
                            </p>
                          </div>
                        )}
                        {order.razorpay_signature && (
                          <div>
                            <p>
                              <strong>Signature:</strong>
                            </p>
                            <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded break-all">
                              {order.razorpay_signature.substring(0, 20)}...
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Timeline & Actions */}
                    <div>
                      <h4 className="font-medium mb-3">Timeline & Actions</h4>
                      <div className="space-y-3">
                        <div className="text-sm">
                          <p>
                            <strong>Created:</strong> {new Date(order.created_at).toLocaleString("en-IN")}
                          </p>
                          <p>
                            <strong>Updated:</strong> {new Date(order.updated_at).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Button variant="outline" size="sm" className="w-full bg-transparent">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Order
                          </Button>
                          <Button variant="outline" size="sm" className="w-full bg-transparent">
                            <Package className="h-4 w-4 mr-2" />
                            Print Invoice
                          </Button>
                          <Button variant="outline" size="sm" className="w-full bg-transparent">
                            <Smartphone className="h-4 w-4 mr-2" />
                            Contact Customer
                          </Button>
                          {order.payment_method === "razorpay" && order.razorpay_payment_id && (
                            <Button variant="outline" size="sm" className="w-full bg-transparent">
                              <Globe className="h-4 w-4 mr-2" />
                              View in Razorpay
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
