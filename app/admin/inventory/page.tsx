"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-firebase-auth"
import { useToast } from "@/hooks/use-toast"
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Minus,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  current_stock: number
  reserved_stock: number
  available_stock: number
  reorder_level: number
  cost_price: number
  selling_price: number
  supplier: string
  last_restocked: string
  status: "in_stock" | "low_stock" | "out_of_stock"
}

interface StockMovement {
  id: string
  product_id: string
  product_name: string
  type: "in" | "out" | "adjustment"
  quantity: number
  reason: string
  created_at: string
  created_by: string
}

export default function AdminInventoryPage() {
  const { user, isAdmin, loading } = useAuth()
  const { toast } = useToast()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0)
  const [adjustmentReason, setAdjustmentReason] = useState("")
  const [isAdjusting, setIsAdjusting] = useState(false)

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadInventoryData()
    } else if (!loading) {
      setIsLoading(false)
    }
  }, [loading, user, isAdmin])

  const loadInventoryData = async () => {
    try {
      setIsLoading(true)
      const [inventoryResponse, movementsResponse] = await Promise.all([
        fetch("/api/admin/inventory"),
        fetch("/api/admin/stock-movements"),
      ])

      if (inventoryResponse.ok && movementsResponse.ok) {
        const inventoryData = await inventoryResponse.json()
        const movementsData = await movementsResponse.json()
        setInventory(inventoryData.inventory || [])
        setStockMovements(movementsData.movements || [])
      } else {
        throw new Error("Failed to fetch inventory data")
      }
    } catch (error) {
      console.error("Error loading inventory data:", error)
      // Mock data for demo
      const mockInventory: InventoryItem[] = [
        {
          id: "1",
          name: "Cotton Saree - Red",
          sku: "SAR-RED-001",
          category: "Sarees",
          current_stock: 25,
          reserved_stock: 3,
          available_stock: 22,
          reorder_level: 10,
          cost_price: 800,
          selling_price: 1200,
          supplier: "Textile Mills Ltd",
          last_restocked: "2024-01-05T10:00:00Z",
          status: "in_stock",
        },
        {
          id: "2",
          name: "Silk Kurta - Blue",
          sku: "KUR-BLU-002",
          category: "Kurtas",
          current_stock: 8,
          reserved_stock: 2,
          available_stock: 6,
          reorder_level: 15,
          cost_price: 600,
          selling_price: 950,
          supplier: "Fashion House",
          last_restocked: "2024-01-03T14:30:00Z",
          status: "low_stock",
        },
        {
          id: "3",
          name: "Designer Lehenga - Gold",
          sku: "LEH-GLD-003",
          category: "Lehengas",
          current_stock: 0,
          reserved_stock: 0,
          available_stock: 0,
          reorder_level: 5,
          cost_price: 2500,
          selling_price: 4000,
          supplier: "Premium Designs",
          last_restocked: "2023-12-20T09:15:00Z",
          status: "out_of_stock",
        },
        {
          id: "4",
          name: "Cotton Dress - Floral",
          sku: "DRS-FLR-004",
          category: "Dresses",
          current_stock: 45,
          reserved_stock: 5,
          available_stock: 40,
          reorder_level: 20,
          cost_price: 400,
          selling_price: 650,
          supplier: "Casual Wear Co",
          last_restocked: "2024-01-08T11:20:00Z",
          status: "in_stock",
        },
      ]

      const mockMovements: StockMovement[] = [
        {
          id: "1",
          product_id: "1",
          product_name: "Cotton Saree - Red",
          type: "in",
          quantity: 50,
          reason: "New stock arrival",
          created_at: "2024-01-05T10:00:00Z",
          created_by: "admin@gangatextiles.com",
        },
        {
          id: "2",
          product_id: "2",
          product_name: "Silk Kurta - Blue",
          type: "out",
          quantity: -2,
          reason: "Customer order",
          created_at: "2024-01-10T15:30:00Z",
          created_by: "system",
        },
        {
          id: "3",
          product_id: "4",
          product_name: "Cotton Dress - Floral",
          type: "adjustment",
          quantity: -3,
          reason: "Damaged items removed",
          created_at: "2024-01-09T09:45:00Z",
          created_by: "admin@gangatextiles.com",
        },
      ]

      setInventory(mockInventory)
      setStockMovements(mockMovements)
      toast({
        title: "Demo Mode",
        description: "Showing sample inventory data",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const adjustStock = async () => {
    if (!selectedItem || adjustmentQuantity === 0) return

    try {
      setIsAdjusting(true)
      const response = await fetch(`/api/admin/inventory/${selectedItem.id}/adjust`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: adjustmentQuantity,
          reason: adjustmentReason,
        }),
      })

      if (response.ok) {
        const updatedItem = await response.json()
        setInventory(inventory.map((item) => (item.id === selectedItem.id ? updatedItem : item)))

        // Add to stock movements
        const newMovement: StockMovement = {
          id: Date.now().toString(),
          product_id: selectedItem.id,
          product_name: selectedItem.name,
          type: "adjustment",
          quantity: adjustmentQuantity,
          reason: adjustmentReason,
          created_at: new Date().toISOString(),
          created_by: user?.email || "admin",
        }
        setStockMovements([newMovement, ...stockMovements])

        setAdjustmentQuantity(0)
        setAdjustmentReason("")
        setSelectedItem(null)

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
    } finally {
      setIsAdjusting(false)
    }
  }

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalItems = inventory.length
  const lowStockItems = inventory.filter((item) => item.status === "low_stock").length
  const outOfStockItems = inventory.filter((item) => item.status === "out_of_stock").length
  const totalValue = inventory.reduce((sum, item) => sum + item.current_stock * item.cost_price, 0)

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
          <h1 className="text-3xl font-bold text-amber-800 mb-2">Inventory Management</h1>
          <p className="text-gray-600">Monitor and manage your product inventory</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{lowStockItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{outOfStockItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalValue.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search products..."
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
                        <SelectItem value="in_stock">In Stock</SelectItem>
                        <SelectItem value="low_stock">Low Stock</SelectItem>
                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Table */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Items ({filteredInventory.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cost Price</TableHead>
                      <TableHead>Selling Price</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              Last restocked: {new Date(item.last_restocked).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.available_stock} available</p>
                            <p className="text-sm text-gray-600">
                              {item.current_stock} total, {item.reserved_stock} reserved
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>₹{item.cost_price.toLocaleString("en-IN")}</TableCell>
                        <TableCell>₹{item.selling_price.toLocaleString("en-IN")}</TableCell>
                        <TableCell>{item.supplier}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
                                Adjust Stock
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adjust Stock - {selectedItem?.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Current Stock: {selectedItem?.current_stock}</Label>
                                </div>

                                <div>
                                  <Label htmlFor="adjustment">Adjustment Quantity</Label>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setAdjustmentQuantity(
                                          Math.max(-selectedItem?.current_stock || 0, adjustmentQuantity - 1),
                                        )
                                      }
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <Input
                                      id="adjustment"
                                      type="number"
                                      value={adjustmentQuantity}
                                      onChange={(e) => setAdjustmentQuantity(Number.parseInt(e.target.value) || 0)}
                                      className="w-24 text-center"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setAdjustmentQuantity(adjustmentQuantity + 1)}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    New stock will be: {(selectedItem?.current_stock || 0) + adjustmentQuantity}
                                  </p>
                                </div>

                                <div>
                                  <Label htmlFor="reason">Reason for Adjustment</Label>
                                  <Input
                                    id="reason"
                                    value={adjustmentReason}
                                    onChange={(e) => setAdjustmentReason(e.target.value)}
                                    placeholder="Enter reason for stock adjustment"
                                  />
                                </div>

                                <Button
                                  onClick={adjustStock}
                                  disabled={isAdjusting || adjustmentQuantity === 0 || !adjustmentReason}
                                  className="w-full"
                                >
                                  {isAdjusting ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Adjusting...
                                    </>
                                  ) : (
                                    "Adjust Stock"
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements">
            <Card>
              <CardHeader>
                <CardTitle>Recent Stock Movements</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="font-medium">{movement.product_name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              movement.type === "in" ? "default" : movement.type === "out" ? "destructive" : "secondary"
                            }
                          >
                            {movement.type === "in" ? "Stock In" : movement.type === "out" ? "Stock Out" : "Adjustment"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={movement.quantity > 0 ? "text-green-600" : "text-red-600"}>
                            {movement.quantity > 0 ? "+" : ""}
                            {movement.quantity}
                          </span>
                        </TableCell>
                        <TableCell>{movement.reason}</TableCell>
                        <TableCell>
                          {new Date(movement.created_at).toLocaleDateString("en-IN")}{" "}
                          {new Date(movement.created_at).toLocaleTimeString("en-IN")}
                        </TableCell>
                        <TableCell>{movement.created_by}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
