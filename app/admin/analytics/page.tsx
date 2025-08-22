"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-firebase-auth"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Download,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AnalyticsData {
  overview: {
    totalRevenue: number
    revenueChange: number
    totalOrders: number
    ordersChange: number
    totalCustomers: number
    customersChange: number
    averageOrderValue: number
    aovChange: number
  }
  salesData: {
    date: string
    revenue: number
    orders: number
  }[]
  topProducts: {
    id: string
    name: string
    sales: number
    revenue: number
    views: number
  }[]
  customerInsights: {
    newCustomers: number
    returningCustomers: number
    customerRetentionRate: number
  }
  categoryPerformance: {
    category: string
    revenue: number
    orders: number
    growth: number
  }[]
}

export default function AdminAnalyticsPage() {
  const { user, isAdmin, loading } = useAuth()
  const { toast } = useToast()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadAnalytics()
    } else if (!loading) {
      setIsLoading(false)
    }
  }, [loading, user, isAdmin, timeRange])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)

      // Mock analytics data - in real app, fetch from API
      const mockData: AnalyticsData = {
        overview: {
          totalRevenue: 125000,
          revenueChange: 12.5,
          totalOrders: 342,
          ordersChange: 8.2,
          totalCustomers: 156,
          customersChange: 15.3,
          averageOrderValue: 2850,
          aovChange: -2.1,
        },
        salesData: [
          { date: "2024-01-01", revenue: 4200, orders: 12 },
          { date: "2024-01-02", revenue: 3800, orders: 10 },
          { date: "2024-01-03", revenue: 5100, orders: 15 },
          { date: "2024-01-04", revenue: 4600, orders: 13 },
          { date: "2024-01-05", revenue: 5800, orders: 18 },
          { date: "2024-01-06", revenue: 6200, orders: 20 },
          { date: "2024-01-07", revenue: 5500, orders: 16 },
        ],
        topProducts: [
          { id: "1", name: "Elegant Silk Dress", sales: 45, revenue: 134550, views: 1250 },
          { id: "2", name: "Designer Handbag", sales: 32, revenue: 63968, views: 890 },
          { id: "3", name: "Cotton Kids T-Shirt", sales: 67, revenue: 40133, views: 2100 },
          { id: "4", name: "Formal Blazer", sales: 18, revenue: 62982, views: 650 },
          { id: "5", name: "Summer Dress", sales: 28, revenue: 25172, views: 780 },
        ],
        customerInsights: {
          newCustomers: 89,
          returningCustomers: 67,
          customerRetentionRate: 42.9,
        },
        categoryPerformance: [
          { category: "Women", revenue: 89500, orders: 198, growth: 15.2 },
          { category: "Kids", revenue: 35500, orders: 144, growth: 8.7 },
        ],
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setAnalyticsData(mockData)
    } catch (error) {
      console.error("Error loading analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadAnalytics()
  }

  const exportData = () => {
    toast({
      title: "Export Started",
      description: "Analytics data export will be ready shortly",
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

  if (!analyticsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-amber-800 mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600">Track your store's performance and insights</p>
            </div>
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{analyticsData.overview.totalRevenue.toLocaleString("en-IN")}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {analyticsData.overview.revenueChange > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                )}
                <span className={analyticsData.overview.revenueChange > 0 ? "text-green-500" : "text-red-500"}>
                  {Math.abs(analyticsData.overview.revenueChange)}%
                </span>
                <span className="ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.totalOrders}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {analyticsData.overview.ordersChange > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                )}
                <span className={analyticsData.overview.ordersChange > 0 ? "text-green-500" : "text-red-500"}>
                  {Math.abs(analyticsData.overview.ordersChange)}%
                </span>
                <span className="ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.totalCustomers}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {analyticsData.overview.customersChange > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                )}
                <span className={analyticsData.overview.customersChange > 0 ? "text-green-500" : "text-red-500"}>
                  {Math.abs(analyticsData.overview.customersChange)}%
                </span>
                <span className="ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{analyticsData.overview.averageOrderValue.toLocaleString("en-IN")}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {analyticsData.overview.aovChange > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                )}
                <span className={analyticsData.overview.aovChange > 0 ? "text-green-500" : "text-red-500"}>
                  {Math.abs(analyticsData.overview.aovChange)}%
                </span>
                <span className="ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top Performing Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-sm font-medium text-amber-800">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          {product.sales} sales • {product.views} views
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{product.revenue.toLocaleString("en-IN")}</p>
                      <p className="text-sm text-gray-600">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analyticsData.customerInsights.newCustomers}
                    </div>
                    <div className="text-sm text-gray-600">New Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analyticsData.customerInsights.returningCustomers}
                    </div>
                    <div className="text-sm text-gray-600">Returning Customers</div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {analyticsData.customerInsights.customerRetentionRate}%
                  </div>
                  <div className="text-sm text-gray-600">Customer Retention Rate</div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>New vs Returning</span>
                    <span>
                      {(
                        (analyticsData.customerInsights.newCustomers /
                          (analyticsData.customerInsights.newCustomers +
                            analyticsData.customerInsights.returningCustomers)) *
                        100
                      ).toFixed(1)}
                      % new
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(analyticsData.customerInsights.newCustomers / (analyticsData.customerInsights.newCustomers + analyticsData.customerInsights.returningCustomers)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Category Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analyticsData.categoryPerformance.map((category) => (
                <div key={category.category} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg">{category.category}</h3>
                    <div className="flex items-center text-sm">
                      {category.growth > 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                      )}
                      <span className={category.growth > 0 ? "text-green-500" : "text-red-500"}>
                        {Math.abs(category.growth)}%
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold">₹{category.revenue.toLocaleString("en-IN")}</p>
                      <p className="text-sm text-gray-600">Revenue</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{category.orders}</p>
                      <p className="text-sm text-gray-600">Orders</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sales Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Sales chart visualization would go here</p>
                <p className="text-sm text-gray-500">Integration with charting library needed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
