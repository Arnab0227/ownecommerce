"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-firebase-auth"
import { useToast } from "@/hooks/use-toast"
import {
  Package,
  Search,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Download,
  Loader2,
  AlertCircle,
  Edit,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface InventoryItem {
  id: string
  name: string
  model_no: string
  category: string
  current_stock: number
  min_stock_level: number
  max_stock_level: number
  price: number
  cost_price: number
  supplier: string
  last_restocked: string
  status: "in_stock" | "low_stock" | "out_of_stock"
  reserved_stock: number
  available_stock: number
}

interface StockMovement {
  id: string
  product_id: string
  product_name: string
  type: "in" | "out" | "adjustment"
  quantity: number
  reason: string
  date: string
  user: string
}

export default function AdminInventoryPage() {
  const { user, isAdmin, loading } = useAuth()
  const { toast } = useToast()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: 0,
    reason: "",
    type: "in" as "in" | "out" | "adjustment",
  })

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadInventory()
      loadStockMovements()
    } else if (!loading) {
      setIsLoading(false)
    }
  }, [loading, user, isAdmin])

  useEffect(() => {
    filterInventory()
  }, [inventory, searchTerm, statusFilter, categoryFilter])

  const loadInventory = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/inventory")

      if (response.ok) {
        const data = await response.json()
        setInventory(data)
      } else {
        throw new Error("Failed to fetch inventory")
      }
    } catch (error) {
      console.error("Error loading inventory:", error)
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadStockMovements = async () => {
    try {
      const response = await fetch("/api/admin/stock-movements")

      if (response.ok) {
        const data = await response.json()
        setMovements(data)
      }
    } catch (error) {
      console.error("Error loading stock movements:", error)
    }
  }

  const filterInventory = () => {
    let filtered = inventory

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.model_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter)
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    setFilteredInventory(filtered)
  }

  const adjustStock = async () => {
    if (!selectedItem || stockAdjustment.quantity === 0) return

    try {
      const response = await fetch(`/api/admin/inventory/${selectedItem.id}/adjust`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stockAdjustment),
      })

      if (response.ok) {
        const updatedItem = await response.json()
        setInventory(inventory.map((item) => (item.id === selectedItem.id ? updatedItem : item)))
        setStockAdjustment({ quantity: 0, reason: "", type: "in" })
        setSelectedItem(null)
        loadStockMovements() // Refresh movements
        toast({
          title: "Success",
          description: "Stock adjusted successfully",
        })
      } else {
        throw new Error("Failed to adjust stock")
      }
    } catch (error) {
      console.error("Error adjusting stock:", error)
      toast({
        title: "Error",
        description: "Failed to adjust stock",
        variant: "destructive",
      })
    }
  }

  const exportInventory = () => {
    const csvContent = [
      [
        "Name",
        "Model No",
        "Category",
        "Current Stock",
        "Min Level",
        "Max Level",
        "Price",
        "Cost",
        "Supplier",
        "Status",
      ].join(","),
      ...filteredInventory.map((item) =>
        [
          item.name,
          item.model_no,
          item.category,
          item.current_stock,
          item.min_stock_level,
          item.max_stock_level,
          item.price,
          item.cost_price,
          item.supplier,
          item.status,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "inventory.csv"
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Inventory data has been exported to CSV",
    })
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

  const lowStockItems = inventory.filter((item) => item.status === "low_stock").length
  const outOfStockItems = inventory.filter((item) => item.status === "out_of_stock").length
  const totalValue = inventory.reduce((sum, item) => sum + item.current_stock * item.cost_price, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-800 mb-2">Inventory Management</h1>
          <p className="text-gray-600">Track and manage your product inventory</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{lowStockItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalValue.toLocaleString("en-IN")}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, model, or supplier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="kids">Kids</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportInventory}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items ({filteredInventory.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredInventory.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No inventory items found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInventory.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{item.name}</h3>
                          <Badge
                            variant={
                              item.status === "in_stock"
                                ? "default"
                                : item.status === "low_stock"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {item.status.replace("_", " ")}
                          </Badge>
                          <Badge variant="outline">{item.category}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Model:</span> {item.model_no}
                          </div>
                          <div>
                            <span className="font-medium">Stock:</span> {item.current_stock} / {item.max_stock_level}
                          </div>
                          <div>
                            <span className="font-medium">Available:</span> {item.available_stock}
                          </div>
                          <div>
                            <span className="font-medium">Reserved:</span> {item.reserved_stock}
                          </div>
                          <div>
                            <span className="font-medium">Price:</span> ₹{item.price.toLocaleString("en-IN")}
                          </div>
                          <div>
                            <span className="font-medium">Cost:</span> ₹{item.cost_price.toLocaleString("en-IN")}
                          </div>
                          <div>
                            <span className="font-medium">Supplier:</span> {item.supplier}
                          </div>
                          <div>
                            <span className="font-medium">Last Restocked:</span>{" "}
                            {new Date(item.last_restocked).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Adjust Stock</DialogTitle>
                              <DialogDescription>Adjust stock levels for {selectedItem?.name}</DialogDescription>
                            </DialogHeader>
                            {selectedItem && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Current Stock</Label>
                                    <p className="text-lg font-semibold">{selectedItem.current_stock}</p>
                                  </div>
                                  <div>
                                    <Label>Available Stock</Label>
                                    <p className="text-lg font-semibold">{selectedItem.available_stock}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="type">Adjustment Type</Label>
                                  <Select
                                    value={stockAdjustment.type}
                                    onValueChange={(value: "in" | "out" | "adjustment") =>
                                      setStockAdjustment({ ...stockAdjustment, type: value })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="in">Stock In</SelectItem>
                                      <SelectItem value="out">Stock Out</SelectItem>
                                      <SelectItem value="adjustment">Adjustment</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="quantity">Quantity</Label>
                                  <Input
                                    id="quantity"
                                    type="number"
                                    value={stockAdjustment.quantity}
                                    onChange={(e) =>
                                      setStockAdjustment({
                                        ...stockAdjustment,
                                        quantity: Number.parseInt(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="reason">Reason</Label>
                                  <Input
                                    id="reason"
                                    value={stockAdjustment.reason}
                                    onChange={(e) => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })}
                                    placeholder="Reason for adjustment"
                                  />
                                </div>
                                <Button
                                  onClick={adjustStock}
                                  disabled={stockAdjustment.quantity === 0 || !stockAdjustment.reason}
                                  className="w-full"
                                >
                                  Adjust Stock
                                </Button>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
