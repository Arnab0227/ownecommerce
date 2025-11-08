"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-firebase-auth"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Shield,
  AlertCircle,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  BarChart3,
  Settings,
  Mail,
  Calendar,
  DollarSign,
  Save,
  X,
  AlertTriangle,
  MessageSquare,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Product {
  id: string
  name: string
  sku: string // Changed from model_no to sku to match API
  description: string
  price: number
  original_price: number
  category: string
  stock_quantity: number // Changed from stock to stock_quantity to match API
  image_url: string
}

interface AdminStats {
  total_products: number
  total_orders: number
  total_revenue: number
  recent_orders: number
  low_stock_products: number
  trending_products: number
}

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<"dashboard" | "products">("dashboard")
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isDeletingAll, setIsDeletingAll] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    sku: "", // Changed from model_no to sku
    description: "",
    price: "",
    original_price: "",
    category: "",
    stock_quantity: "", // Changed from stock to stock_quantity
    image_url: "",
  })

  useEffect(() => {
    if (!loading && user && isAdmin) {
      fetchProducts()
      fetchAdminStats()
    } else if (!loading) {
      setIsLoading(false)
      setIsLoadingStats(false)
    }
  }, [loading, user, isAdmin])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      } else {
        throw new Error("Failed to fetch products")
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAdminStats = async () => {
    try {
      setIsLoadingStats(true)

      // Fetch real stats from API
      const [productsRes, ordersRes] = await Promise.all([fetch("/api/admin/products"), fetch("/api/admin/orders")])

      const realStats: AdminStats = {
        total_products: 0,
        total_orders: 0,
        total_revenue: 0,
        recent_orders: 0,
        low_stock_products: 0,
        trending_products: 0,
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        realStats.total_products = productsData.length
        realStats.low_stock_products = productsData.filter((p: Product) => p.stock_quantity < 10).length
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        realStats.total_orders = ordersData.length
        realStats.total_revenue = ordersData.reduce((sum: number, order: any) => sum + order.total_amount, 0)

        // Recent orders (last 7 days)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        realStats.recent_orders = ordersData.filter((order: any) => new Date(order.created_at) > weekAgo).length
      }

      setStats(realStats)
    } catch (error) {
      console.error("Error fetching admin stats:", error)
      // Fallback to mock data if API fails
      setStats({
        total_products: products.length || 0,
        total_orders: 0,
        total_revenue: 0,
        recent_orders: 0,
        low_stock_products: 0,
        trending_products: 0,
      })
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products"
      const method = editingProduct ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku, // Changed from model_no to sku
          description: formData.description,
          price: Number.parseFloat(formData.price),
          original_price: Number.parseFloat(formData.original_price),
          category: formData.category,
          stock_quantity: Number.parseInt(formData.stock_quantity), // Changed from stock to stock_quantity
          image_url: formData.image_url || "/placeholder.svg?height=400&width=300",
        }),
      })

      if (response.ok) {
        const productData = await response.json()

        if (editingProduct) {
          // Update existing product
          setProducts(products.map((p) => (p.id === editingProduct.id ? productData : p)))
          toast({
            title: "Success",
            description: "Product updated successfully",
          })
        } else {
          // Add new product
          setProducts([productData, ...products])
          toast({
            title: "Success",
            description: "Product added successfully",
          })
        }

        // Reset form
        setFormData({
          name: "",
          sku: "", // Changed from model_no to sku
          description: "",
          price: "",
          original_price: "",
          category: "",
          stock_quantity: "", // Changed from stock to stock_quantity
          image_url: "",
        })
        setEditingProduct(null)

        // Refresh stats
        fetchAdminStats()
      } else {
        throw new Error(`Failed to ${editingProduct ? "update" : "add"} product`)
      }
    } catch (error) {
      console.error(`Error ${editingProduct ? "updating" : "adding"} product:`, error)
      toast({
        title: "Error",
        description: `Failed to ${editingProduct ? "update" : "add"} product`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || "",
      sku: product.sku || "", // Changed from model_no to sku
      description: product.description || "",
      price: product.price?.toString() || "",
      original_price: product.original_price?.toString() || "",
      category: product.category || "",
      stock_quantity: product.stock_quantity?.toString() || "", // Changed from stock to stock_quantity
      image_url: product.image_url || "",
    })
  }

  const handleCancelEdit = () => {
    setEditingProduct(null)
    setFormData({
      name: "",
      sku: "", // Changed from model_no to sku
      description: "",
      price: "",
      original_price: "",
      category: "",
      stock_quantity: "", // Changed from stock to stock_quantity
      image_url: "",
    })
  }

  const handleDelete = async (productId: string) => {
    setIsDeleting(productId)
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setProducts(products.filter((p) => p.id !== productId))
        toast({
          title: "Success",
          description: "Product deleted successfully",
        })
        fetchAdminStats()
      } else {
        const errorData = await response.json()

        if (response.status === 409) {
          toast({
            title: "Cannot Delete Product",
            description: errorData.message || "This product has existing orders and cannot be deleted.",
            variant: "destructive",
          })
        } else {
          throw new Error(errorData.error || "Failed to delete product")
        }
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleDeleteAll = async () => {
    setIsDeletingAll(true)
    try {
      const deletePromises = products.map((product) => fetch(`/api/admin/products/${product.id}`, { method: "DELETE" }))

      await Promise.all(deletePromises)

      setProducts([])
      toast({
        title: "Success",
        description: "All products deleted successfully",
      })
      fetchAdminStats()
    } catch (error) {
      console.error("Error deleting all products:", error)
      toast({
        title: "Error",
        description: "Failed to delete all products",
        variant: "destructive",
      })
    } finally {
      setIsDeletingAll(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
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
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-gray-600 mb-4">Please sign in to access the admin panel.</p>
              <Button onClick={() => (window.location.href = "/auth")}>Sign In</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">You don't have admin privileges.</p>

              <Alert className="mb-4 text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Current user:</strong> {user.email}
                    </p>
                    <p>
                      <strong>Admin email:</strong> {process.env.NEXT_PUBLIC_ADMIN_EMAIL || "Not configured"}
                    </p>
                    <p>
                      <strong>Is Admin:</strong> {isAdmin ? "Yes" : "No"}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button onClick={() => (window.location.href = "/")} className="w-full">
                  Go Home
                </Button>
                <p className="text-xs text-gray-500">
                  Make sure NEXT_PUBLIC_ADMIN_EMAIL is set in your environment variables
                </p>
              </div>
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
          <h1 className="text-3xl font-bold text-amber-800 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your store.</p>
          <div className="mt-2 text-sm text-green-600">✅ Logged in as admin: {user.email}</div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "dashboard" ? "bg-amber-100 text-amber-800" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "products" ? "bg-amber-100 text-amber-800" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Manage Products
            </button>
          </div>
        </div>

        {activeTab === "dashboard" && (
          <>
            {/* Quick Stats */}
            {isLoadingStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total_products}</div>
                    <p className="text-xs text-muted-foreground">{stats.low_stock_products} low stock items</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total_orders}</div>
                    <p className="text-xs text-muted-foreground">{stats.recent_orders} this week</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{stats.total_revenue.toLocaleString("en-IN")}</div>
                    <p className="text-xs text-muted-foreground">Total revenue</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.low_stock_products}</div>
                    <p className="text-xs text-muted-foreground">Items below 10 units</p>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-amber-600" />
                    Manage Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Add, edit, and manage your product catalog</p>
                  <Button className="w-full" onClick={() => setActiveTab("products")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Product
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href="/admin/orders">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-green-600" />
                      Order Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">View and process customer orders</p>
                    <Button variant="outline" className="w-full bg-transparent">
                      View All Orders
                    </Button>
                  </CardContent>
                </Link>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href="/admin/analytics">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Analytics Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Track views, trends, and performance metrics</p>
                    <Button variant="outline" className="w-full bg-transparent">
                      View Analytics
                    </Button>
                  </CardContent>
                </Link>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href="/admin/queries">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-indigo-600" />
                      Contact Queries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Manage customer inquiries and support requests</p>
                    <Button variant="outline" className="w-full bg-transparent">
                      View Queries
                    </Button>
                  </CardContent>
                </Link>
              </Card>
            </div>

            {/* Additional Admin Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <Link href="/admin/customers">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8 text-purple-600" />
                      <div>
                        <h3 className="font-semibold">Customers</h3>
                        <p className="text-sm text-gray-600">Manage users</p>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <Link href="/admin/reports">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Mail className="h-8 w-8 text-red-600" />
                      <div>
                        <h3 className="font-semibold">Email Reports</h3>
                        <p className="text-sm text-gray-600">Automated insights</p>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <Link href="/admin/inventory">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-8 w-8 text-orange-600" />
                      <div>
                        <h3 className="font-semibold">Inventory</h3>
                        <p className="text-sm text-gray-600">Stock management</p>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <Link href="/admin/settings">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Settings className="h-8 w-8 text-gray-600" />
                      <div>
                        <h3 className="font-semibold">Settings</h3>
                        <p className="text-sm text-gray-600">Store configuration</p>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </div>
          </>
        )}

        {activeTab === "products" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add/Edit Product Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {editingProduct ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </CardTitle>
                {editingProduct && (
                  <Button variant="outline" size="sm" onClick={handleCancelEdit} className="w-fit bg-transparent">
                    <X className="h-4 w-4 mr-2" />
                    Cancel Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="sku">Model Number (SKU)</Label> {/* Updated label and id */}
                    <Input
                      id="sku" // Changed from model_no to sku
                      value={formData.sku} // Changed from model_no to sku
                      onChange={(e) => handleInputChange("sku", e.target.value)} // Changed from model_no to sku
                      placeholder="e.g., GT-WOM-SAR-001"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Selling Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange("price", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="original_price">Original Price (₹)</Label>
                      <Input
                        id="original_price"
                        type="number"
                        step="0.01"
                        value={formData.original_price}
                        onChange={(e) => handleInputChange("original_price", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="women">Women</SelectItem>
                          <SelectItem value="kids">Kids</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="stock_quantity">Stock Quantity</Label> {/* Updated id */}
                      <Input
                        id="stock_quantity" // Changed from stock to stock_quantity
                        type="number"
                        value={formData.stock_quantity} // Changed from stock to stock_quantity
                        onChange={(e) => handleInputChange("stock_quantity", e.target.value)} // Changed from stock to stock_quantity
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="image_url">Image URL (optional)</Label>
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => handleInputChange("image_url", e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingProduct ? "Updating Product..." : "Adding Product..."}
                      </>
                    ) : (
                      <>
                        {editingProduct ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                        {editingProduct ? "Update Product" : "Add Product"}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Products List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Current Products ({products.length})</CardTitle>
                {products.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          Delete All Products
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete all {products.length} products? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAll}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isDeletingAll}
                        >
                          {isDeletingAll ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Delete All"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No products found</p>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {products.map((product) => (
                      <div key={product.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-xs text-gray-500 mb-1">Model: {product.sku}</p>{" "}
                            {/* Changed from model_no to sku */}
                            <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-medium">₹{product.price}</span>
                              <span className="text-gray-500 line-through">₹{product.original_price}</span>
                              <span className="text-blue-600 capitalize">{product.category}</span>
                              <span className={`${product.stock_quantity < 10 ? "text-red-600" : "text-green-600"}`}>
                                Stock: {product.stock_quantity} {/* Changed from stock to stock_quantity */}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(product)}
                              disabled={editingProduct?.id === product.id}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={isDeleting === product.id}>
                                  {isDeleting === product.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(product.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
