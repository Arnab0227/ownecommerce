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
  email?: string // allow fallback from API/coalesce
  total_amount: number
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  payment_method: "razorpay" | "cod"
  payment_status: "pending" | "paid" | "failed"
  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
  delivery_fee?: number
  user_notes?: string | null
  admin_notes?: string | null
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

interface UserProfile {
  user_id: string
  name?: string
  email?: string
  phone?: string
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
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map())

  const formatINR = (value: unknown) => {
    const n = Number(value ?? 0)
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)
  }

  const isLikelyValidUserId = (id?: string) => Boolean(id && id !== "1" && id.length > 10)

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

        const uniqueUserIds = [...new Set(ordersWithItems.map((order) => order.user_id))].filter((id) =>
          isLikelyValidUserId(id),
        )
        const profilePromises = uniqueUserIds.map(async (userId) => {
          const profile = await fetchUserProfile(userId)
          return { userId, profile }
        })

        const profileResults = await Promise.all(profilePromises)
        const newUserProfiles = new Map<string, UserProfile>()
        profileResults.forEach(({ userId, profile }) => {
          if (profile) newUserProfiles.set(userId, profile)
        })
        setUserProfiles(newUserProfiles)
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

    const normalizeEmail = (o: any) => (o?.user_email || o?.email || "").toString().toLowerCase()

    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (order: any) =>
          order.id?.toString()?.toLowerCase().includes(q) ||
          normalizeEmail(order).includes(q) ||
          order.razorpay_order_id?.toLowerCase()?.includes(q) ||
          order.razorpay_payment_id?.toLowerCase()?.includes(q),
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
      if (newStatus === "shipped") {
        // Enforce providing tracking number via Edit screen
        toast({
          title: "Tracking required",
          description: "Provide a tracking number in Edit Order before marking as shipped.",
        })
        window.location.href = `/admin/orders/${orderId}/edit`
        return
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          send_notification: true,
        }),
      })

      if (response.ok) {
        setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
        toast({
          title: "Success",
          description: `Order status updated to ${newStatus}. Customer notification sent.`,
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
      totalRevenue: orders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0),
    }
    return stats
  }

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      if (!isLikelyValidUserId(userId)) return null
      const response = await fetch(`/api/users/profile?userId=${userId}`)
      if (response.ok) {
        const profile = await response.json()
        return profile
      }
      if (response.status === 404) return null
    } catch (error) {
      console.error(`Error fetching profile for user ${userId}:`, error)
    }
    return null
  }

  const formatUserId = (userId: string, email?: string, shippingName?: string) => {
    const profile = userProfiles.get(userId)
    const idShort = `${userId?.substring(0, 8) || ""}...`
    if (profile?.name && profile.name.trim()) {
      return `${profile.name} (${idShort})`
    }
    if (shippingName && shippingName.trim()) {
      return `${shippingName} (${idShort})`
    }
    if (email && email.includes("@")) {
      const emailName = email.split("@")[0]
      return `${emailName} (${idShort})`
    }
    return idShort
  }

  const handleEditOrder = (orderId: string) => {
    // Navigate to edit order page or open modal
    window.location.href = `/admin/orders/${orderId}/edit`
  }

  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - Order #${order.id}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .order-info { margin-bottom: 20px; }
              .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .items-table th { background-color: #f2f2f2; }
              .total { font-weight: bold; font-size: 18px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>INVOICE</h1>
              <p>Order #${order.id}</p>
            </div>
            <div class="order-info">
              <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString("en-IN")}</p>
              <p><strong>Customer:</strong> ${order.user_email || order.email || "N/A"}</p>
              <p><strong>Payment Method:</strong> ${getPaymentMethodLabel(order.payment_method)}</p>
              <p><strong>Payment Status:</strong> ${order.payment_status}</p>
            </div>
            <div class="shipping-address">
              <h3>Shipping Address:</h3>
              <p>${order.shipping_address?.name || "N/A"}</p>
              <p>${order.shipping_address?.address || "N/A"}</p>
              <p>${order.shipping_address?.city || "N/A"}, ${order.shipping_address?.state || "N/A"} ${order.shipping_address?.pincode || "N/A"}</p>
              <p>Phone: ${order.shipping_address?.phone || "N/A"}</p>
            </div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${
                  order.items?.length
                    ? (order.items as OrderItem[])
                        .map(
                          (item: OrderItem) => `
                <tr>
                  <td>${item.product_name || `Product ${item.product_id}`}</td>
                  <td>${item.quantity}</td>
                  <td>${formatINR(item.price)}</td>
                  <td>${formatINR(item.total)}</td>
                </tr>`,
                        )
                        .join("")
                    : '<tr><td colspan="4">No items</td></tr>'
                }
              </tbody>
            </table>
            <div class="total">
              <p>Delivery Fee: ${formatINR(order.delivery_fee ?? 0)}</p>
              <p>Total Amount: ${formatINR(order.total_amount)}</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleContactCustomer = (order: Order) => {
    const email = order.user_email || order.email
    const rawPhone = order.shipping_address?.phone || ""
    const phoneDigits = rawPhone.replace(/\D+/g, "")
    if (email) {
      const subject = `Regarding Your Order #${order.id}`
      const body = `Dear Customer,\n\nWe hope this message finds you well. We are writing regarding your recent order #${order.id}.\n\nOrder Details:\n- Order Date: ${new Date(order.created_at).toLocaleDateString("en-IN")}\n- Total Amount: ${formatINR(order.total_amount)}\n- Status: ${order.status}\n\nIf you have any questions or concerns, please don't hesitate to reach out to us.\n\nBest regards,\nCustomer Service Team`
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      return
    }
    if (phoneDigits) {
      window.location.href = `tel:${phoneDigits}`
    }
  }

  const handleViewInRazorpay = (order: Order) => {
    if (order.razorpay_payment_id) {
      const url = `https://dashboard.razorpay.com/app/payments/${order.razorpay_payment_id}`
      window.open(url, "_blank", "noopener,noreferrer")
      return
    }
    if (order.razorpay_order_id) {
      const url = `https://dashboard.razorpay.com/app/orders/${order.razorpay_order_id}`
      window.open(url, "_blank", "noopener,noreferrer")
    }
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
                <div className="text-lg font-bold text-green-600">{formatINR(stats.totalRevenue)}</div>
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
            filteredOrders.map((order: Order) => (
              <Card key={`order-${order.id}`}>
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
                          {order.user_email || order.email || "Not provided"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.created_at).toLocaleDateString("en-IN")}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatINR(order.total_amount)}
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
                        {(order.items as OrderItem[] | undefined)?.map((item: OrderItem) => (
                          <div key={`item-${item.id}-${order.id}`} className="flex items-center gap-3">
                            <img
                              src={item.product_image || "/placeholder.svg?height=48&width=48"}
                              alt={item.product_name || "Product"}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.product_name || `Product ${item.product_id}`}</p>
                              <p className="text-xs text-gray-600">
                                {item.quantity} × {formatINR(item.price)} = {formatINR(item.total)}
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
                          <strong>Email:</strong> {order.user_email || order.email || "Not provided"}
                        </p>
                        <p>
                          <strong>User:</strong>{" "}
                          {formatUserId(order.user_id, order.user_email || order.email, order.shipping_address?.name)}
                        </p>
                        <div className="pt-2">
                          <p className="font-medium flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            Shipping Address
                          </p>
                          <div className="text-gray-600 ml-5">
                            <p>{order.shipping_address?.name || "Name not provided"}</p>
                            <p>{order.shipping_address?.address || "Address not provided"}</p>
                            <p>
                              {order.shipping_address?.city || "City"}, {order.shipping_address?.state || "State"}
                            </p>
                            <p>{order.shipping_address?.pincode || "Pincode not provided"}</p>
                            <p>{order.shipping_address?.phone || "Phone not provided"}</p>
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
                        <p>
                          <strong>Delivery Fee:</strong> {formatINR(order.delivery_fee ?? 0)}
                        </p>
                        {order.user_notes ? (
                          <div className="mt-2">
                            <p className="font-medium">Customer Notes</p>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{order.user_notes}</p>
                          </div>
                        ) : null}
                        {order.admin_notes ? (
                          <div className="mt-2">
                            <p className="font-medium">Admin Notes</p>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{order.admin_notes}</p>
                          </div>
                        ) : null}
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-transparent"
                            onClick={() => handleEditOrder(order.id)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Order
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-transparent"
                            onClick={() => handlePrintInvoice(order)}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Print Invoice
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-transparent"
                            onClick={() => handleContactCustomer(order)}
                          >
                            <Smartphone className="h-4 w-4 mr-2" />
                            Contact Customer
                          </Button>
                          {order.payment_method === "razorpay" && order.razorpay_payment_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full bg-transparent"
                              onClick={() => handleViewInRazorpay(order)}
                            >
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
