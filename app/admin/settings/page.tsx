"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/hooks/use-firebase-auth"
import { useToast } from "@/hooks/use-toast"
import { Store, Shield, Bell, CreditCard, Save, Loader2, AlertCircle, ExternalLink } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StoreSettings {
  store_name: string
  store_description: string
  store_email: string
  store_phone: string
  store_address: string
  currency: string
  timezone: string
  shipping_fee: number
  free_shipping_threshold: number
  privacy_policy_url: string
  terms_of_service_url: string
  data_deletion_url: string
  shipping_policy_url: string
  cancellation_refund_url: string
}

interface NotificationSettings {
  email_notifications: boolean
  order_notifications: boolean
  inventory_alerts: boolean
  customer_notifications: boolean
  marketing_emails: boolean
}

interface PaymentSettings {
  razorpay_enabled: boolean
  cod_enabled: boolean
}

export default function AdminSettingsPage() {
  const { user, isAdmin, loading } = useAuth()
  const { toast } = useToast()
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    store_name: "",
    store_description: "",
    store_email: "",
    store_phone: "",
    store_address: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
    shipping_fee: 50,
    free_shipping_threshold: 999,
    privacy_policy_url: "",
    terms_of_service_url: "",
    data_deletion_url: "",
    shipping_policy_url: "",
    cancellation_refund_url: "",
  })
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    order_notifications: true,
    inventory_alerts: true,
    customer_notifications: false,
    marketing_emails: true,
  })
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    razorpay_enabled: false,
    cod_enabled: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadSettings()
    } else if (!loading) {
      setIsLoading(false)
    }
  }, [loading, user, isAdmin])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/settings")

      if (response.ok) {
        const data = await response.json()
        setStoreSettings({
          ...storeSettings,
          ...data.store,
        })
        setNotificationSettings(data.notifications || notificationSettings)
        setPaymentSettings(data.payments || paymentSettings)
      } else {
        throw new Error("Failed to fetch settings")
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async (type: "store" | "notifications" | "payments") => {
    try {
      setIsSaving(true)
      const data = {
        store: type === "store" ? storeSettings : undefined,
        notifications: type === "notifications" ? notificationSettings : undefined,
        payments: type === "payments" ? paymentSettings : undefined,
      }

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Settings saved successfully",
        })
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-800 mb-2">Store Settings</h1>
          <p className="text-gray-600">Configure your store settings and preferences</p>
        </div>

        <Tabs defaultValue="store" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="store">Store Info</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
          </TabsList>

          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="store_name">Store Name</Label>
                    <Input
                      id="store_name"
                      value={storeSettings.store_name}
                      onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                      placeholder="Your Store Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="store_email">Store Email</Label>
                    <Input
                      id="store_email"
                      type="email"
                      value={storeSettings.store_email}
                      onChange={(e) => setStoreSettings({ ...storeSettings, store_email: e.target.value })}
                      placeholder="store@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="store_phone">Store Phone</Label>
                    <Input
                      id="store_phone"
                      value={storeSettings.store_phone}
                      onChange={(e) => setStoreSettings({ ...storeSettings, store_phone: e.target.value })}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={storeSettings.currency}
                      onValueChange={(value) => setStoreSettings({ ...storeSettings, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="store_description">Store Description</Label>
                  <Textarea
                    id="store_description"
                    value={storeSettings.store_description}
                    onChange={(e) => setStoreSettings({ ...storeSettings, store_description: e.target.value })}
                    placeholder="Describe your store..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="store_address">Store Address</Label>
                  <Textarea
                    id="store_address"
                    value={storeSettings.store_address}
                    onChange={(e) => setStoreSettings({ ...storeSettings, store_address: e.target.value })}
                    placeholder="Complete store address..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="shipping_fee">Shipping Fee (₹)</Label>
                    <Input
                      id="shipping_fee"
                      type="number"
                      value={storeSettings.shipping_fee}
                      onChange={(e) =>
                        setStoreSettings({ ...storeSettings, shipping_fee: Number.parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="free_shipping_threshold">Free Shipping Above (₹)</Label>
                    <Input
                      id="free_shipping_threshold"
                      type="number"
                      value={storeSettings.free_shipping_threshold}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          free_shipping_threshold: Number.parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <Button onClick={() => saveSettings("store")} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Store Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email_notifications">Email Notifications</Label>
                      <p className="text-sm text-gray-600">Receive general email notifications</p>
                    </div>
                    <Switch
                      id="email_notifications"
                      checked={notificationSettings.email_notifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, email_notifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="order_notifications">Order Notifications</Label>
                      <p className="text-sm text-gray-600">Get notified about new orders</p>
                    </div>
                    <Switch
                      id="order_notifications"
                      checked={notificationSettings.order_notifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, order_notifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="inventory_alerts">Inventory Alerts</Label>
                      <p className="text-sm text-gray-600">Low stock and out of stock alerts</p>
                    </div>
                    <Switch
                      id="inventory_alerts"
                      checked={notificationSettings.inventory_alerts}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, inventory_alerts: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="customer_notifications">Customer Notifications</Label>
                      <p className="text-sm text-gray-600">New customer registrations</p>
                    </div>
                    <Switch
                      id="customer_notifications"
                      checked={notificationSettings.customer_notifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, customer_notifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing_emails">Marketing Emails</Label>
                      <p className="text-sm text-gray-600">Promotional and marketing emails</p>
                    </div>
                    <Switch
                      id="marketing_emails"
                      checked={notificationSettings.marketing_emails}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, marketing_emails: checked })
                      }
                    />
                  </div>
                </div>

                <Button onClick={() => saveSettings("notifications")} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Notification Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="razorpay_enabled">Razorpay Payments</Label>
                      <p className="text-sm text-gray-600">
                        Enable online payments via Razorpay (Keys configured in environment)
                      </p>
                    </div>
                    <Switch
                      id="razorpay_enabled"
                      checked={paymentSettings.razorpay_enabled}
                      onCheckedChange={(checked) =>
                        setPaymentSettings({ ...paymentSettings, razorpay_enabled: checked })
                      }
                    />
                  </div>

                  {paymentSettings.razorpay_enabled && (
                    <div className="ml-6 p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-800">Razorpay Configuration Status</span>
                      </div>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>✅ Environment variables configured</li>
                        <li>✅ Credit/Debit Cards enabled</li>
                        <li>✅ UPI Payments enabled</li>
                        <li>✅ Digital Wallets enabled</li>
                        <li>✅ Net Banking enabled</li>
                        <li>✅ Pay Later options enabled</li>
                      </ul>
                      <p className="text-xs text-green-600 mt-2">
                        Keys are securely managed through environment variables
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="cod_enabled">Cash on Delivery</Label>
                      <p className="text-sm text-gray-600">Allow cash on delivery payments</p>
                    </div>
                    <Switch
                      id="cod_enabled"
                      checked={paymentSettings.cod_enabled}
                      onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, cod_enabled: checked })}
                    />
                  </div>
                </div>

                <Button onClick={() => saveSettings("payments")} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Payment Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="privacy_policy_url">Privacy Policy URL</Label>
                    <Input
                      id="privacy_policy_url"
                      value={storeSettings.privacy_policy_url}
                      onChange={(e) => setStoreSettings({ ...storeSettings, privacy_policy_url: e.target.value })}
                      placeholder="https://yourstore.com/privacy-policy"
                    />
                    <p className="text-sm text-gray-600 mt-1">Required for Facebook login integration</p>
                  </div>

                  <div>
                    <Label htmlFor="terms_of_service_url">Terms of Service URL</Label>
                    <Input
                      id="terms_of_service_url"
                      value={storeSettings.terms_of_service_url}
                      onChange={(e) => setStoreSettings({ ...storeSettings, terms_of_service_url: e.target.value })}
                      placeholder="https://yourstore.com/terms-of-service"
                    />
                    <p className="text-sm text-gray-600 mt-1">Required for Facebook login integration</p>
                  </div>

                  <div>
                    <Label htmlFor="data_deletion_url">Data Deletion Instructions URL</Label>
                    <Input
                      id="data_deletion_url"
                      value={storeSettings.data_deletion_url}
                      onChange={(e) => setStoreSettings({ ...storeSettings, data_deletion_url: e.target.value })}
                      placeholder="https://yourstore.com/data-deletion"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Required for Facebook login - Instructions for users to delete their data
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="shipping_policy_url">Shipping Policy URL</Label>
                    <Input
                      id="shipping_policy_url"
                      value={storeSettings.shipping_policy_url}
                      onChange={(e) => setStoreSettings({ ...storeSettings, shipping_policy_url: e.target.value })}
                      placeholder="https://yourstore.com/shipping-policy"
                    />
                    <p className="text-sm text-gray-600 mt-1">Required for Razorpay - Shipping and delivery policy</p>
                  </div>

                  <div>
                    <Label htmlFor="cancellation_refund_url">Cancellation & Refund Policy URL</Label>
                    <Input
                      id="cancellation_refund_url"
                      value={storeSettings.cancellation_refund_url}
                      onChange={(e) => setStoreSettings({ ...storeSettings, cancellation_refund_url: e.target.value })}
                      placeholder="https://yourstore.com/cancellation-refund"
                    />
                    <p className="text-sm text-gray-600 mt-1">Required for Razorpay - Cancellation and refund policy</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Facebook Login Requirements
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Privacy Policy URL must be publicly accessible</li>
                      <li>• Terms of Service URL must be publicly accessible</li>
                      <li>• Data Deletion URL must provide clear instructions</li>
                      <li>• All URLs must use HTTPS protocol</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Razorpay Requirements
                    </h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Shipping Policy must be accessible</li>
                      <li>�� Cancellation & Refund Policy required</li>
                      <li>• Terms of Service must be linked</li>
                      <li>• Privacy Policy must be available</li>
                    </ul>
                  </div>
                </div>

                <Button onClick={() => saveSettings("store")} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Policy Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
