"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-firebase-auth"
import { useToast } from "@/hooks/use-toast"
import { Mail, Send, TrendingUp, Eye, Plus, Loader2, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EmailCampaign {
  id: string
  name: string
  subject: string
  type: "newsletter" | "promotion" | "announcement" | "welcome"
  status: "draft" | "scheduled" | "sent" | "failed"
  recipients: number
  sent_count: number
  open_rate: number
  click_rate: number
  created_at: string
  sent_at: string | null
  content: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: string
  created_at: string
}

export default function AdminEmailReportsPage() {
  const { user, isAdmin, loading } = useAuth()
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    subject: "",
    type: "newsletter" as const,
    content: "",
    template_id: "",
  })

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadEmailData()
    } else if (!loading) {
      setIsLoading(false)
    }
  }, [loading, user, isAdmin])

  const loadEmailData = async () => {
    try {
      setIsLoading(true)
      const [campaignResponse, templateResponse] = await Promise.all([
        fetch("/api/admin/email-reports"),
        fetch("/api/admin/email-templates"),
      ])

      if (campaignResponse.ok && templateResponse.ok) {
        const campaignData = await campaignResponse.json()
        const templateData = await templateResponse.json()
        setCampaigns(campaignData.campaigns || [])
        setTemplates(templateData.templates || [])
      } else {
        throw new Error("Failed to fetch email data")
      }
    } catch (error) {
      console.error("Error loading email data:", error)
      // Mock data for demo
      const mockCampaigns: EmailCampaign[] = [
        {
          id: "1",
          name: "New Year Sale 2024",
          subject: "🎉 New Year Special - Up to 70% Off!",
          type: "promotion",
          status: "sent",
          recipients: 1250,
          sent_count: 1248,
          open_rate: 24.5,
          click_rate: 3.2,
          created_at: "2024-01-01T10:00:00Z",
          sent_at: "2024-01-01T12:00:00Z",
          content: "Celebrate the New Year with amazing discounts on all products!",
        },
        {
          id: "2",
          name: "Weekly Newsletter #52",
          subject: "This Week's Fashion Trends",
          type: "newsletter",
          status: "sent",
          recipients: 2100,
          sent_count: 2095,
          open_rate: 18.7,
          click_rate: 2.1,
          created_at: "2024-01-08T09:00:00Z",
          sent_at: "2024-01-08T10:00:00Z",
          content: "Discover the latest fashion trends and styling tips.",
        },
        {
          id: "3",
          name: "Welcome Series - Part 1",
          subject: "Welcome to Ganga Textiles!",
          type: "welcome",
          status: "scheduled",
          recipients: 45,
          sent_count: 0,
          open_rate: 0,
          click_rate: 0,
          created_at: "2024-01-10T14:30:00Z",
          sent_at: null,
          content: "Thank you for joining our community!",
        },
      ]

      const mockTemplates: EmailTemplate[] = [
        {
          id: "1",
          name: "Promotional Email",
          subject: "Special Offer Just for You!",
          content: "<h1>Special Offer</h1><p>Don't miss out on our exclusive deals!</p>",
          type: "promotion",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          name: "Newsletter Template",
          subject: "Weekly Updates",
          content: "<h1>This Week's Highlights</h1><p>Stay updated with our latest news.</p>",
          type: "newsletter",
          created_at: "2024-01-01T00:00:00Z",
        },
      ]

      setCampaigns(mockCampaigns)
      setTemplates(mockTemplates)
      toast({
        title: "Demo Mode",
        description: "Showing sample email campaign data",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createCampaign = async () => {
    try {
      setIsCreating(true)
      const response = await fetch("/api/admin/email-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCampaign),
      })

      if (response.ok) {
        const campaign = await response.json()
        setCampaigns([campaign, ...campaigns])
        setNewCampaign({
          name: "",
          subject: "",
          type: "newsletter",
          content: "",
          template_id: "",
        })
        toast({
          title: "Success",
          description: "Email campaign created successfully",
        })
      } else {
        throw new Error("Failed to create campaign")
      }
    } catch (error) {
      console.error("Error creating campaign:", error)
      toast({
        title: "Error",
        description: "Failed to create email campaign",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const sendCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/admin/email-reports/${campaignId}/send`, {
        method: "POST",
      })

      if (response.ok) {
        setCampaigns(
          campaigns.map((campaign) =>
            campaign.id === campaignId
              ? { ...campaign, status: "sent" as const, sent_at: new Date().toISOString() }
              : campaign,
          ),
        )
        toast({
          title: "Success",
          description: "Email campaign sent successfully",
        })
      } else {
        throw new Error("Failed to send campaign")
      }
    } catch (error) {
      console.error("Error sending campaign:", error)
      toast({
        title: "Error",
        description: "Failed to send email campaign",
        variant: "destructive",
      })
    }
  }

  const totalSent = campaigns.reduce((sum, campaign) => sum + campaign.sent_count, 0)
  const avgOpenRate =
    campaigns.length > 0 ? campaigns.reduce((sum, campaign) => sum + campaign.open_rate, 0) / campaigns.length : 0
  const avgClickRate =
    campaigns.length > 0 ? campaigns.reduce((sum, campaign) => sum + campaign.click_rate, 0) / campaigns.length : 0

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
          <h1 className="text-3xl font-bold text-amber-800 mb-2">Email Reports & Campaigns</h1>
          <p className="text-gray-600">Manage your email marketing campaigns and track performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Send className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSent.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Open Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{avgOpenRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Click Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{avgClickRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="create">Create Campaign</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Email Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Open Rate</TableHead>
                      <TableHead>Click Rate</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-gray-600">{campaign.subject}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {campaign.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              campaign.status === "sent"
                                ? "default"
                                : campaign.status === "scheduled"
                                  ? "secondary"
                                  : campaign.status === "failed"
                                    ? "destructive"
                                    : "outline"
                            }
                          >
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{campaign.recipients.toLocaleString()}</TableCell>
                        <TableCell>{campaign.open_rate.toFixed(1)}%</TableCell>
                        <TableCell>{campaign.click_rate.toFixed(1)}%</TableCell>
                        <TableCell>
                          {campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString("en-IN") : "Not sent"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>{campaign.name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium">Subject</label>
                                    <p>{campaign.subject}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Content</label>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                      <p>{campaign.content}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Recipients</label>
                                      <p>{campaign.recipients.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Sent</label>
                                      <p>{campaign.sent_count.toLocaleString()}</p>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {campaign.status === "draft" && (
                              <Button size="sm" onClick={() => sendCampaign(campaign.id)}>
                                <Send className="h-4 w-4 mr-1" />
                                Send
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create New Campaign</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="campaign_name">Campaign Name</Label>
                    <Input
                      id="campaign_name"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      placeholder="Enter campaign name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="campaign_type">Campaign Type</Label>
                    <Select
                      value={newCampaign.type}
                      onValueChange={(value: any) => setNewCampaign({ ...newCampaign, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="welcome">Welcome</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="campaign_subject">Email Subject</Label>
                  <Input
                    id="campaign_subject"
                    value={newCampaign.subject}
                    onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                    placeholder="Enter email subject"
                  />
                </div>

                <div>
                  <Label htmlFor="campaign_template">Use Template (Optional)</Label>
                  <Select
                    value={newCampaign.template_id}
                    onValueChange={(value) => setNewCampaign({ ...newCampaign, template_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="campaign_content">Email Content</Label>
                  <Textarea
                    id="campaign_content"
                    value={newCampaign.content}
                    onChange={(e) => setNewCampaign({ ...newCampaign, content: e.target.value })}
                    placeholder="Enter email content"
                    rows={8}
                  />
                </div>

                <Button onClick={createCampaign} disabled={isCreating || !newCampaign.name || !newCampaign.subject}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Campaign
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {template.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{template.subject}</TableCell>
                        <TableCell>{new Date(template.created_at).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
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
