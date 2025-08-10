"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  User,
  ShoppingBag,
  Heart,
  MapPin,
  CreditCard,
  Bell,
  Settings,
  Package,
  HelpCircle,
  Phone,
  Mail,
  Gift,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in to access your dashboard</h1>
        <Link href="/auth">
          <Button className="bg-gradient-to-r from-pink-600 to-purple-600">Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome back!</h1>
              <p className="opacity-90">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 bg-white shadow-sm">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="flex items-center space-x-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Wishlist</span>
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Addresses</span>
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center space-x-2">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Help</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">12</p>
                    </div>
                    <ShoppingBag className="h-8 w-8 text-pink-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Wishlist Items</p>
                      <p className="text-2xl font-bold text-gray-900">8</p>
                    </div>
                    <Heart className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="text-2xl font-bold text-gray-900">₹24,580</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Reward Points</p>
                      <p className="text-2xl font-bold text-gray-900">1,250</p>
                    </div>
                    <Gift className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2 text-pink-600" />
                    Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3].map((order) => (
                    <div key={order} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Order #BB00{order}23</p>
                        <p className="text-sm text-gray-600">₹2,499 • 2 items</p>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Delivered
                      </Badge>
                    </div>
                  ))}
                  <Link href="/orders">
                    <Button variant="outline" className="w-full bg-transparent">
                      View All Orders
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2 text-pink-600" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-pink-50 rounded-lg border-l-4 border-pink-600">
                    <p className="font-medium text-pink-800">New Arrivals!</p>
                    <p className="text-sm text-pink-600">Check out our latest women's collection</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-600">
                    <p className="font-medium text-purple-800">Sale Alert</p>
                    <p className="text-sm text-purple-600">Up to 50% off on kids wear</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-600">
                    <p className="font-medium text-green-800">Order Delivered</p>
                    <p className="text-sm text-green-600">Your recent order has been delivered</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((order) => (
                    <div key={order} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">Order #BB00{order}23</h3>
                          <p className="text-sm text-gray-600">Placed on {new Date().toLocaleDateString("en-IN")}</p>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Delivered
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">₹{(Math.random() * 5000 + 1000).toFixed(0)}</p>
                          <p className="text-sm text-gray-600">{Math.floor(Math.random() * 3) + 1} items</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            Reorder
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wishlist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-500" />
                  Your Wishlist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <img
                        src="/placeholder.svg?height=200&width=200"
                        alt="Wishlist item"
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                      <h3 className="font-medium mb-2">Beautiful Dress {item}</h3>
                      <p className="text-pink-600 font-semibold mb-3">₹{(Math.random() * 3000 + 1000).toFixed(0)}</p>
                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600">
                          Add to Cart
                        </Button>
                        <Button variant="outline" size="sm">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-pink-600" />
                    Saved Addresses
                  </CardTitle>
                  <Button className="bg-gradient-to-r from-pink-600 to-purple-600">Add New Address</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">Home</h3>
                    <Badge>Default</Badge>
                  </div>
                  <p className="text-gray-600 mb-3">
                    123 Fashion Street, Bandra West
                    <br />
                    Mumbai, Maharashtra 400050
                    <br />
                    Phone: +91 98765 43210
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 bg-transparent">
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">Office</h3>
                  </div>
                  <p className="text-gray-600 mb-3">
                    456 Business Park, Andheri East
                    <br />
                    Mumbai, Maharashtra 400069
                    <br />
                    Phone: +91 98765 43210
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 bg-transparent">
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="help" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-pink-600" />
                    Frequently Asked Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-2">How do I track my order?</h3>
                    <p className="text-sm text-gray-600">
                      You can track your order from the Orders section in your dashboard or use the tracking link sent
                      to your email.
                    </p>
                  </div>
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-2">What is your return policy?</h3>
                    <p className="text-sm text-gray-600">
                      We offer easy returns within 7 days of delivery. Items should be in original condition with tags
                      attached.
                    </p>
                  </div>
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-2">How do I change my order?</h3>
                    <p className="text-sm text-gray-600">
                      Orders can be modified within 1 hour of placement. Contact our support team for assistance.
                    </p>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    View All FAQs
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Support</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg">
                    <Phone className="h-5 w-5 text-pink-600" />
                    <div>
                      <p className="font-medium">Call Us</p>
                      <p className="text-sm text-gray-600">+91 98765 43210</p>
                      <p className="text-xs text-gray-500">Mon-Sat, 9 AM - 7 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <Mail className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Email Us</p>
                      <p className="text-sm text-gray-600">support@bellaboutique.com</p>
                      <p className="text-xs text-gray-500">We'll respond within 24 hours</p>
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-pink-600 to-purple-600">Start Live Chat</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-pink-600" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Personal Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <input type="text" className="w-full p-2 border rounded-lg" defaultValue="Jane Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input type="email" className="w-full p-2 border rounded-lg" defaultValue={user.email} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone</label>
                      <input type="tel" className="w-full p-2 border rounded-lg" defaultValue="+91 98765 43210" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Date of Birth</label>
                      <input type="date" className="w-full p-2 border rounded-lg" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Preferences</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span>Email notifications for new arrivals</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span>SMS notifications for order updates</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded" />
                      <span>Marketing emails and promotions</span>
                    </label>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button className="bg-gradient-to-r from-pink-600 to-purple-600">Save Changes</Button>
                  <Button variant="outline">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
