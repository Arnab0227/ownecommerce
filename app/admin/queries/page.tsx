"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-firebase-auth"
import { useToast } from "@/hooks/use-toast"
import {
  MessageSquare,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  User,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ContactQuery {
  id: string
  user_id?: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  status: "new" | "in_progress" | "resolved" | "closed"
  created_at: string
  updated_at?: string
  user_name?: string
  user_email?: string
}

export default function AdminQueriesPage() {
  const { user, isAdmin, loading } = useAuth()
  const { toast } = useToast()
  const [queries, setQueries] = useState<ContactQuery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedQuery, setSelectedQuery] = useState<ContactQuery | null>(null)

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadQueries()
    } else if (!loading) {
      setIsLoading(false)
    }
  }, [loading, user, isAdmin])

  const loadQueries = async () => {
    try {
      setIsLoading(true)
      console.log("[v0] Fetching contact queries...")
      const token = await user?.getIdToken()

      const response = await fetch("/api/admin/queries", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Contact queries response:", data)
        setQueries(data.queries || data || [])
      } else {
        const errorText = await response.text()
        console.error("API Error:", errorText)
        throw new Error(`Failed to fetch queries: ${response.status}`)
      }
    } catch (error) {
      console.error("Error loading queries:", error)
      toast({
        title: "Error",
        description: "Failed to load contact queries. Please check the console for details.",
        variant: "destructive",
      })
      setQueries([])
    } finally {
      setIsLoading(false)
    }
  }

  const updateQueryStatus = async (queryId: string, newStatus: string) => {
    try {
      const token = await user?.getIdToken()

      const response = await fetch("/api/admin/queries", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: queryId, status: newStatus }),
      })

      if (response.ok) {
        setQueries(
          queries.map((query) =>
            query.id === queryId
              ? { ...query, status: newStatus as ContactQuery["status"], updated_at: new Date().toISOString() }
              : query,
          ),
        )
        toast({
          title: "Success",
          description: "Query status updated successfully",
        })
      } else {
        throw new Error("Failed to update query status")
      }
    } catch (error) {
      console.error("Error updating query status:", error)
      toast({
        title: "Error",
        description: "Failed to update query status",
        variant: "destructive",
      })
    }
  }

  const formatDateIndia = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <AlertCircle className="h-4 w-4" />
      case "in_progress":
        return <Clock className="h-4 w-4" />
      case "resolved":
        return <CheckCircle className="h-4 w-4" />
      case "closed":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const filteredQueries = queries.filter((query) => {
    const matchesSearch =
      query.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || query.status === statusFilter
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
          <h1 className="text-3xl font-bold text-amber-800 mb-2">Contact Queries</h1>
          <p className="text-gray-600">Manage customer inquiries and support requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Queries</p>
                  <p className="text-2xl font-bold text-gray-900">{queries.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New Queries</p>
                  <p className="text-2xl font-bold text-gray-900">{queries.filter((q) => q.status === "new").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {queries.filter((q) => q.status === "in_progress").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {queries.filter((q) => q.status === "resolved" || q.status === "closed").length}
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
                    placeholder="Search queries..."
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
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Queries ({filteredQueries.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredQueries.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No queries found</h3>
                <p className="text-gray-600">
                  {queries.length === 0
                    ? "No contact queries have been submitted yet."
                    : "No queries match your current filters."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQueries.map((query) => (
                    <TableRow key={query.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{query.name}</p>
                          <p className="text-sm text-gray-600">{query.email}</p>
                          {query.phone && <p className="text-xs text-gray-500">{query.phone}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{query.subject}</p>
                        <p className="text-sm text-gray-600 truncate max-w-xs">{query.message}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            query.status === "new"
                              ? "destructive"
                              : query.status === "in_progress"
                                ? "secondary"
                                : "default"
                          }
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(query.status)}
                          {query.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{formatDateIndia(query.created_at)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedQuery(query)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Query Details</DialogTitle>
                              </DialogHeader>
                              {selectedQuery && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Customer Name
                                      </label>
                                      <p>{selectedQuery.name}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        Email
                                      </label>
                                      <p>{selectedQuery.email}</p>
                                    </div>
                                    {selectedQuery.phone && (
                                      <div>
                                        <label className="text-sm font-medium flex items-center gap-2">
                                          <Phone className="h-4 w-4" />
                                          Phone
                                        </label>
                                        <p>{selectedQuery.phone}</p>
                                      </div>
                                    )}
                                    <div>
                                      <label className="text-sm font-medium">Status</label>
                                      <Badge
                                        variant={
                                          selectedQuery.status === "new"
                                            ? "destructive"
                                            : selectedQuery.status === "in_progress"
                                              ? "secondary"
                                              : "default"
                                        }
                                        className="flex items-center gap-1 w-fit"
                                      >
                                        {getStatusIcon(selectedQuery.status)}
                                        {selectedQuery.status.replace("_", " ")}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium">Subject</label>
                                    <p className="font-medium">{selectedQuery.subject}</p>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium">Message</label>
                                    <div className="p-3 bg-gray-50 rounded border">
                                      <p className="whitespace-pre-wrap">{selectedQuery.message}</p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                    <div>
                                      <label className="font-medium">Submitted</label>
                                      <p>{formatDateIndia(selectedQuery.created_at)}</p>
                                    </div>
                                    {selectedQuery.updated_at && (
                                      <div>
                                        <label className="font-medium">Last Updated</label>
                                        <p>{formatDateIndia(selectedQuery.updated_at)}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Select value={query.status} onValueChange={(value) => updateQueryStatus(query.id, value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
