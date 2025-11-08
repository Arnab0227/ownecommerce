"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-firebase-auth"
import { useToast } from "@/hooks/use-toast"
import { Users, Search, Filter, Download, Eye, Ban, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface Customer {
  id: string
  email: string
  display_name: string
  phone: string
  created_at: string
  status: "active" | "inactive" | "banned"
  total_orders: number
  total_spent: number
  last_order_date: string
  addresses: Array<{
    type?: string
    street?: string
    city: string
    state: string
    pincode: string
    is_default?: boolean
    address?: string
  }>
  purchases?: Array<{
    order_id: string
    product_id: string
    product_name: string
    quantity: number
    price: number
    total: number
    status: string
    date: string
  }>
  orders?: Array<{
    id: string
    order_number: string
    total_amount: number
    delivery_fee: number
    status: string
    payment_method: string
    payment_status: string
    tracking_number?: string
    created_at: string
    updated_at: string
    shipping_address?: any
    billing_address?: any
  }>
  analytics?: {
    total_product_views: number
    unique_products_viewed: number
    avg_session_duration: number
    last_activity_date?: string
    engagement_score: number
    most_viewed_product?: string | null
    viewed_categories: string[]
    active_days: number
    avg_view_duration: number
    repeated_products: Array<{ product_id: number; product_name: string; views: number }>
    frequency_category: string
    avg_days_between_orders: number
    days_since_last_order: number
    is_at_risk: boolean
    order_patterns: { preferred_days: number[]; preferred_months: number[] }
  }
}

export default function AdminCustomersPage() {
  const { user, isAdmin, loading } = useAuth()
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadCustomers()
    } else if (!loading) {
      setIsLoading(false)
    }
  }, [loading, user, isAdmin])

  const loadCustomers = async () => {
    try {
      setIsLoading(true)
      console.log("[v0] Loading customers from API...")

      const token = await user?.getIdToken()
      const response = await fetch("/api/admin/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Customers loaded:", data.customers?.length || 0)
        setCustomers(data.customers || [])
      } else {
        const errorText = await response.text()
        console.error("[v0] API Error:", errorText)
        throw new Error(`Failed to fetch customers: ${response.status}`)
      }
    } catch (error) {
      console.error("[v0] Error loading customers:", error)
      toast({
        title: "Error",
        description: "Failed to load customer data. Please check the console for details.",
        variant: "destructive",
      })
      setCustomers([])
    } finally {
      setIsLoading(false)
    }
  }

  const updateCustomerStatus = async (customerId: string, newStatus: string) => {
    try {
      const token = await user?.getIdToken()
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setCustomers(
          customers.map((customer) =>
            customer.id === customerId
              ? { ...customer, status: newStatus as "active" | "inactive" | "banned" }
              : customer,
          ),
        )
        toast({
          title: "Success",
          description: "Customer status updated successfully",
        })
      } else {
        throw new Error("Failed to update customer status")
      }
    } catch (error) {
      console.error("Error updating customer status:", error)
      toast({
        title: "Error",
        description: "Failed to update customer status",
        variant: "destructive",
      })
    }
  }

  const exportCustomers = () => {
    const csvContent = [
      ["Email", "Name", "Phone", "Status", "Total Orders", "Total Spent", "Created At"].join(","),
      ...customers.map((customer) =>
        [
          customer.email,
          customer.display_name,
          customer.phone,
          customer.status,
          customer.total_orders,
          customer.total_spent,
          new Date(customer.created_at).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "customers.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatDateIndia = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN")
  }

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.display_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter
    return matchesSearch && matchesStatus
  })

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-800 mb-2">Customer Management</h1>
          <p className="text-gray-600">Manage your customers and their information</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Customers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.filter((c) => c.status === "active").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Ban className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Banned Customers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.filter((c) => c.status === "banned").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      customers.filter((c) => {
                        const created = new Date(c.created_at)
                        const now = new Date()
                        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                      }).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={exportCustomers} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.display_name}</p>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{customer.phone}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          customer.status === "active"
                            ? "default"
                            : customer.status === "banned"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{customer.total_orders}</TableCell>
                    <TableCell>₹{customer.total_spent.toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      {customer.last_order_date
                        ? new Date(customer.last_order_date).toLocaleDateString("en-IN")
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(customer)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Customer Details</DialogTitle>
                            </DialogHeader>
                            {selectedCustomer && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Name</label>
                                    <p>{selectedCustomer.display_name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <p>{selectedCustomer.email}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Phone</label>
                                    <p>{selectedCustomer.phone}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <Badge
                                      variant={
                                        selectedCustomer.status === "active"
                                          ? "default"
                                          : selectedCustomer.status === "banned"
                                            ? "destructive"
                                            : "secondary"
                                      }
                                    >
                                      {selectedCustomer.status}
                                    </Badge>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">Addresses</label>
                                  {selectedCustomer.addresses.length > 0 ? (
                                    <div className="space-y-2 mt-2">
                                      {selectedCustomer.addresses.map((address, index) => (
                                        <div key={index} className="p-3 bg-gray-50 rounded">
                                          <p className="font-medium capitalize">{address.type}</p>
                                          <p>{address.address}</p>
                                          <p>
                                            {address.city}, {address.state} - {address.pincode}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-gray-500">No addresses saved</p>
                                  )}
                                </div>

                                <div>
                                  <label className="text-sm font-medium">Recent Purchases (Last 30 days)</label>
                                  {selectedCustomer.purchases && selectedCustomer.purchases.length > 0 ? (
                                    <div className="mt-2 border rounded">
                                      <div className="grid grid-cols-5 gap-2 text-xs font-medium px-3 py-2 bg-gray-50">
                                        <span>Order ID</span>
                                        <span>Product</span>
                                        <span>Quantity</span>
                                        <span>Amount</span>
                                        <span>Date</span>
                                      </div>
                                      <div className="max-h-60 overflow-auto divide-y">
                                        {selectedCustomer.purchases.map((p) => (
                                          <div
                                            key={`${p.order_id}-${p.product_id}`}
                                            className="grid grid-cols-5 gap-2 px-3 py-2 text-sm"
                                          >
                                            <span className="font-mono text-xs">{p.order_id}</span>
                                            <span>{p.product_name}</span>
                                            <span>{p.quantity}</span>
                                            <span>₹{p.total.toLocaleString("en-IN")}</span>
                                            <span>{formatDateIndia(p.date)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 mt-2">No recent purchases</p>
                                  )}
                                </div>

                                <div>
                                  <label className="text-sm font-medium">
                                    Order History ({selectedCustomer.orders?.length || 0} orders)
                                  </label>
                                  {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                                    <div className="mt-2 border rounded">
                                      <div className="grid grid-cols-6 gap-2 text-xs font-medium px-3 py-2 bg-gray-50">
                                        <span>Order #</span>
                                        <span>Amount</span>
                                        <span>Status</span>
                                        <span>Payment</span>
                                        <span>Date</span>
                                        <span>Tracking</span>
                                      </div>
                                      <div className="max-h-80 overflow-auto divide-y">
                                        {selectedCustomer.orders.map((order) => (
                                          <div key={order.id} className="grid grid-cols-6 gap-2 px-3 py-2 text-sm">
                                            <span className="font-mono text-xs">{order.order_number || order.id}</span>
                                            <span>₹{order.total_amount.toLocaleString("en-IN")}</span>
                                            <span>
                                              <Badge
                                                variant={
                                                  order.status === "delivered"
                                                    ? "default"
                                                    : order.status === "cancelled"
                                                      ? "destructive"
                                                      : "secondary"
                                                }
                                              >
                                                {order.status}
                                              </Badge>
                                            </span>
                                            <span className="capitalize">{order.payment_method}</span>
                                            <span>{formatDateIndia(order.created_at)}</span>
                                            <span className="text-xs">{order.tracking_number || "N/A"}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 mt-2">No orders found</p>
                                  )}
                                </div>

                                <div>
                                  <label className="text-sm font-medium">Behavior Analytics</label>
                                  {selectedCustomer.analytics ? (
                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div className="p-3 bg-gray-50 rounded">
                                        <p className="text-xs text-gray-600">Total Product Views</p>
                                        <p className="text-lg font-semibold">
                                          {selectedCustomer.analytics.total_product_views}
                                        </p>
                                      </div>
                                      <div className="p-3 bg-gray-50 rounded">
                                        <p className="text-xs text-gray-600">Unique Products Viewed</p>
                                        <p className="text-lg font-semibold">
                                          {selectedCustomer.analytics.unique_products_viewed}
                                        </p>
                                      </div>
                                      <div className="p-3 bg-gray-50 rounded">
                                        <p className="text-xs text-gray-600">Engagement Score</p>
                                        <p className="text-lg font-semibold">
                                          {selectedCustomer.analytics.engagement_score}
                                        </p>
                                      </div>
                                      <div className="p-3 bg-gray-50 rounded">
                                        <p className="text-xs text-gray-600">Avg View Duration</p>
                                        <p className="text-lg font-semibold">
                                          {Math.round(selectedCustomer.analytics.avg_view_duration)}s
                                        </p>
                                      </div>
                                      <div className="p-3 bg-gray-50 rounded md:col-span-2">
                                        <p className="text-xs text-gray-600">Most Viewed Product</p>
                                        <p className="text-sm font-medium">
                                          {selectedCustomer.analytics.most_viewed_product || "—"}
                                        </p>
                                      </div>
                                      <div className="p-3 bg-gray-50 rounded md:col-span-2">
                                        <p className="text-xs text-gray-600">Repeatedly Viewed Products</p>
                                        {selectedCustomer.analytics.repeated_products?.length ? (
                                          <ul className="mt-1 text-sm list-disc list-inside">
                                            {selectedCustomer.analytics.repeated_products.map((rp, i) => (
                                              <li key={`rp-${selectedCustomer.id}-${rp.product_id}-${i}`}>
                                                {rp.product_name} — {rp.views} views
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p className="text-sm text-gray-600 mt-1">No repeats detected</p>
                                        )}
                                      </div>
                                      <div className="p-3 bg-gray-50 rounded">
                                        <p className="text-xs text-gray-600">Frequency Category</p>
                                        <p className="text-lg font-semibold capitalize">
                                          {selectedCustomer.analytics.frequency_category}
                                        </p>
                                      </div>
                                      <div className="p-3 bg-gray-50 rounded">
                                        <p className="text-xs text-gray-600">Avg Days Between Orders</p>
                                        <p className="text-lg font-semibold">
                                          {Math.round(selectedCustomer.analytics.avg_days_between_orders)}
                                        </p>
                                      </div>
                                      <div className="p-3 bg-gray-50 rounded md:col-span-2">
                                        <p className="text-xs text-gray-600">At Risk</p>
                                        <p className="text-lg font-semibold">
                                          {selectedCustomer.analytics.is_at_risk ? "Yes" : "No"}
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 mt-2">No analytics available</p>
                                  )}
                                </div>

                                {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                                  <div>
                                    <label className="text-sm font-medium">Spend Over Time</label>
                                    <div className="mt-2">
                                      <ChartContainer
                                        config={{ amount: { label: "Amount", color: "hsl(var(--chart-1))" } }}
                                        className="h-40 w-full"
                                      >
                                        <ResponsiveContainer width="100%" height="100%">
                                          <LineChart
                                            data={selectedCustomer.orders
                                              .map((o) => ({
                                                date: new Date(o.created_at).toLocaleDateString("en-IN"),
                                                amount: o.total_amount,
                                              }))
                                              .reverse()}
                                            margin={{ top: 4, right: 12, left: 8, bottom: 4 }}
                                          >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                            <YAxis tick={{ fontSize: 10 }} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Line
                                              type="monotone"
                                              dataKey="amount"
                                              stroke="var(--color-amount)"
                                              dot={false}
                                              strokeWidth={2}
                                            />
                                          </LineChart>
                                        </ResponsiveContainer>
                                      </ChartContainer>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Select
                          value={customer.status}
                          onValueChange={(value) => updateCustomerStatus(customer.id, value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="banned">Banned</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
