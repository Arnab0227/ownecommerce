"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-firebase-auth"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, Eye, Users, ShoppingCart, Mail, Loader2, BarChart3 } from "lucide-react"

interface AnalyticsData {
  period: string
  total_views: number
  unique_views: number
  top_products: Array<{
    id: number
    name: string
    category: string
    total_views: number
    unique_views: number
    total_orders: number
    revenue: number
    trend_score: number
    rank_position: number
  }>
  categories_performance: Array<{
    category: string
    views: number
    orders: number
    revenue: number
  }>
  daily_views: Array<{
    date: string
    views: number
    unique_views: number
  }>
}

const COLORS = ["#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6"]

export default function AnalyticsPage() {
  const { user, isAdmin, loading } = useAuth()
  const { toast } = useToast()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly")
  const [isSendingReport, setIsSendingReport] = useState(false)

  useEffect(() => {
    if (!loading && user && isAdmin) {
      fetchAnalyticsData()
    }
  }, [loading, user, isAdmin, period])

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/analytics/dashboard?period=${period}`)

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data")
      }

      const data = await response.json()
      setAnalyticsData(data)
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sendEmailReport = async () => {
    try {
      setIsSendingReport(true)
      const response = await fetch("/api/analytics/email-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          period: period,
          recipient: user?.email,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send email report")
      }

      toast({
        title: "Success",
        description: "Analytics report sent to your email!",
      })
    } catch (error) {
      console.error("Error sending email report:", error)
      toast({
        title: "Error",
        description: "Failed to send email report",
        variant: "destructive",
      })
    } finally {
      setIsSendingReport(false)
    }
  }

  if (loading) {
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
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600">Admin privileges required to access analytics.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-800 mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600">Track product views, trends, and performance metrics</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={period} onValueChange={(value: "daily" | "weekly" | "monthly") => setPeriod(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={sendEmailReport} disabled={isSendingReport}>
                {isSendingReport ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Email Report
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
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
        ) : analyticsData ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.total_views.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {period.charAt(0).toUpperCase() + period.slice(1)} period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.unique_views.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {analyticsData.unique_views > 0
                      ? `${((analyticsData.unique_views / analyticsData.total_views) * 100).toFixed(1)}% of total views`
                      : "No unique visitors"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Trending Products</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.top_products.length}</div>
                  <p className="text-xs text-muted-foreground">Products with views</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹
                    {analyticsData.categories_performance
                      .reduce((sum, cat) => sum + cat.revenue, 0)
                      .toLocaleString("en-IN")}
                  </div>
                  <p className="text-xs text-muted-foreground">From tracked orders</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Views Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Views Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.daily_views}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value, name) => [value, name === "views" ? "Total Views" : "Unique Views"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ fill: "#f59e0b" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="unique_views"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.categories_performance}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, views }) => `${category}: ${views}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="views"
                      >
                        {analyticsData.categories_performance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Views"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Top Products Table */}
            <Card>
              <CardHeader>
                <CardTitle>Top Trending Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Rank</th>
                        <th className="text-left p-2">Product</th>
                        <th className="text-left p-2">Category</th>
                        <th className="text-left p-2">Views</th>
                        <th className="text-left p-2">Unique Views</th>
                        <th className="text-left p-2">Orders</th>
                        <th className="text-left p-2">Revenue</th>
                        <th className="text-left p-2">Trend Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.top_products.slice(0, 10).map((product) => (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className="flex items-center">
                              <span className="font-semibold text-amber-600">#{product.rank_position}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="font-medium">{product.name}</div>
                          </td>
                          <td className="p-2">
                            <span className="capitalize text-sm bg-gray-100 px-2 py-1 rounded">{product.category}</span>
                          </td>
                          <td className="p-2">{product.total_views}</td>
                          <td className="p-2">{product.unique_views}</td>
                          <td className="p-2">{product.total_orders}</td>
                          <td className="p-2">₹{product.revenue.toLocaleString("en-IN")}</td>
                          <td className="p-2">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full"
                                  style={{ width: `${Math.min((product.trend_score / 100) * 100, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm">{product.trend_score.toFixed(1)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Category Stats */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Category Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.categories_performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="views" fill="#f59e0b" name="Views" />
                    <Bar dataKey="orders" fill="#3b82f6" name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No analytics data available</p>
          </div>
        )}
      </div>
    </div>
  )
}
