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
import { SalesTrendChart } from "@/components/charts/sales-trend-chart"

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
  const [timeRange, setTimeRange] = useState("monthly")
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

      const token = user?.getIdToken ? await user.getIdToken() : null
      if (!token) {
        throw new Error("No authentication token available")
      }

      const response = await fetch(`/api/analytics/dashboard?period=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Admin privileges required.")
        }
        throw new Error("Failed to fetch analytics data")
      }

      const data = await response.json()
      setAnalyticsData(data)
    } catch (error) {
      console.error("Error loading analytics:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load analytics data",
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-amber-800 mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600">Track your store's performance and insights</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full sm:w-auto bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportData} className="w-full sm:w-auto bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">
                ₹{analyticsData.overview.totalRevenue.toLocaleString("en-IN")}
              </div>
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
              <CardTitle className="text-xs md:text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{analyticsData.overview.totalOrders}</div>
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
              <CardTitle className="text-xs md:text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{analyticsData.overview.totalCustomers}</div>
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
              <CardTitle className="text-xs md:text-sm font-medium">Avg Order Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Package className="h-5 w-5" />
                Top Performing Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topProducts.length > 0 ? (
                  analyticsData.topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-amber-100 rounded-full flex items-center justify-center text-xs md:text-sm font-medium text-amber-800">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm md:text-base line-clamp-1">{product.name}</p>
                          <p className="text-xs md:text-sm text-gray-600">
                            {product.sales} sales • {product.views} views
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm md:text-base">₹{product.revenue.toLocaleString("en-IN")}</p>
                        <p className="text-xs md:text-sm text-gray-600">Revenue</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No product data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Users className="h-5 w-5" />
                Customer Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-green-600">
                      {analyticsData.customerInsights.newCustomers}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">New Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-blue-600">
                      {analyticsData.customerInsights.returningCustomers}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">Returning Customers</div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-purple-600">
                    {analyticsData.customerInsights.customerRetentionRate}%
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Customer Retention Rate</div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs md:text-sm">
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
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <BarChart3 className="h-5 w-5" />
              Category Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {analyticsData.categoryPerformance.length > 0 ? (
                analyticsData.categoryPerformance.map((category) => (
                  <div key={category.category} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-base md:text-lg">{category.category}</h3>
                      <div className="flex items-center text-xs md:text-sm">
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
                        <p className="text-xl md:text-2xl font-bold">₹{category.revenue.toLocaleString("en-IN")}</p>
                        <p className="text-xs md:text-sm text-gray-600">Revenue</p>
                      </div>
                      <div>
                        <p className="text-xl md:text-2xl font-bold">{category.orders}</p>
                        <p className="text-xs md:text-sm text-gray-600">Orders</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4 col-span-2">No category data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <BarChart3 className="h-5 w-5" />
              Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.salesData?.length ? (
              <SalesTrendChart data={analyticsData.salesData} />
            ) : (
              <div className="h-48 md:h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm md:text-base">No sales data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
