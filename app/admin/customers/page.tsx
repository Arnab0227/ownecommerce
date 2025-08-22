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
    type: string
    address: string
    city: string
    state: string
    pincode: string
  }>
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
      const response = await fetch("/api/admin/customers")

      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      } else {
        throw new Error("Failed to fetch customers")
      }
    } catch (error) {
      console.error("Error loading customers:", error)
      // Mock data for demo
      const mockCustomers: Customer[] = [
        {
          id: "1",
          email: "john.doe@example.com",
          display_name: "John Doe",
          phone: "+91 9876543210",
          created_at: "2024-01-15T10:30:00Z",
          status: "active",
          total_orders: 5,
          total_spent: 12500,
          last_order_date: "2024-01-10T14:20:00Z",
          addresses: [
            {
              type: "home",
              address: "123 Main Street, Apartment 4B",
              city: "Mumbai",
              state: "Maharashtra",
              pincode: "400001",
            },
          ],
        },
        {
          id: "2",
          email: "jane.smith@example.com",
          display_name: "Jane Smith",
          phone: "+91 9876543211",
          created_at: "2024-01-12T09:15:00Z",
          status: "active",
          total_orders: 3,
          total_spent: 8750,
          last_order_date: "2024-01-08T16:45:00Z",
          addresses: [
            {
              type: "home",
              address: "456 Oak Avenue",
              city: "Delhi",
              state: "Delhi",
              pincode: "110001",
            },
          ],
        },
        {
          id: "3",
          email: "mike.wilson@example.com",
          display_name: "Mike Wilson",
          phone: "+91 9876543212",
          created_at: "2024-01-08T11:20:00Z",
          status: "inactive",
          total_orders: 1,
          total_spent: 2500,
          last_order_date: "2024-01-05T12:30:00Z",
          addresses: [],
        },
      ]
      setCustomers(mockCustomers)
      toast({
        title: "Demo Mode",
        description: "Showing sample customer data",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateCustomerStatus = async (customerId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: {
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
      ...filteredCustomers.map((customer) =>
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
