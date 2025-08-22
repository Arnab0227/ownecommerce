"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-firebase-auth"
import { useToast } from "@/hooks/use-toast"
import { Gift, CreditCard, Check, Copy, Loader2, Plus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface GiftCard {
  id: string
  code: string
  amount: number
  balance: number
  purchaseDate: string
  expiryDate: string
  status: "active" | "expired" | "used"
  recipientEmail?: string
  message?: string
}

interface GiftCardTemplate {
  id: string
  name: string
  design: string
  amounts: number[]
  image: string
}

export default function GiftCardsPage() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [redeemCode, setRedeemCode] = useState("")

  const [purchaseForm, setPurchaseForm] = useState({
    amount: 1000,
    recipientEmail: "",
    recipientName: "",
    message: "",
    senderName: "",
    selectedTemplate: "classic",
  })

  const templates: GiftCardTemplate[] = [
    {
      id: "classic",
      name: "Classic",
      design: "Elegant gold design",
      amounts: [500, 1000, 2000, 5000],
      image: "/placeholder.svg?height=200&width=300&text=Classic+Gift+Card",
    },
    {
      id: "festive",
      name: "Festive",
      design: "Colorful celebration theme",
      amounts: [500, 1000, 2000, 5000],
      image: "/placeholder.svg?height=200&width=300&text=Festive+Gift+Card",
    },
    {
      id: "birthday",
      name: "Birthday",
      design: "Birthday celebration theme",
      amounts: [500, 1000, 2000, 5000],
      image: "/placeholder.svg?height=200&width=300&text=Birthday+Gift+Card",
    },
  ]

  useEffect(() => {
    if (user) {
      loadGiftCards()
    } else if (!loading) {
      setIsLoading(false)
    }
  }, [user, loading])

  const loadGiftCards = async () => {
    try {
      // Mock gift cards data - in real app, fetch from API
      const mockGiftCards: GiftCard[] = [
        {
          id: "1",
          code: "GT-GIFT-ABC123",
          amount: 2000,
          balance: 1500,
          purchaseDate: "2024-01-10",
          expiryDate: "2025-01-10",
          status: "active",
          recipientEmail: "friend@example.com",
          message: "Happy Birthday! Hope you find something you love!",
        },
        {
          id: "2",
          code: "GT-GIFT-XYZ789",
          amount: 1000,
          balance: 0,
          purchaseDate: "2023-12-15",
          expiryDate: "2024-12-15",
          status: "used",
          message: "Merry Christmas!",
        },
        {
          id: "3",
          code: "GT-GIFT-DEF456",
          amount: 500,
          balance: 500,
          purchaseDate: "2024-01-20",
          expiryDate: "2025-01-20",
          status: "active",
        },
      ]

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setGiftCards(mockGiftCards)
    } catch (error) {
      console.error("Error loading gift cards:", error)
      toast({
        title: "Error",
        description: "Failed to load gift cards",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchaseGiftCard = async () => {
    setIsPurchasing(true)
    try {
      // In real app, process payment and create gift card
      const newGiftCard: GiftCard = {
        id: Date.now().toString(),
        code: `GT-GIFT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        amount: purchaseForm.amount,
        balance: purchaseForm.amount,
        purchaseDate: new Date().toISOString().split("T")[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "active",
        recipientEmail: purchaseForm.recipientEmail || undefined,
        message: purchaseForm.message || undefined,
      }

      setGiftCards([newGiftCard, ...giftCards])

      // Reset form
      setPurchaseForm({
        amount: 1000,
        recipientEmail: "",
        recipientName: "",
        message: "",
        senderName: "",
        selectedTemplate: "classic",
      })

      toast({
        title: "Gift Card Purchased!",
        description: `Gift card worth ₹${purchaseForm.amount} has been created successfully.`,
      })

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to purchase gift card",
        variant: "destructive",
      })
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleRedeemGiftCard = async () => {
    if (!redeemCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a gift card code",
        variant: "destructive",
      })
      return
    }

    setIsRedeeming(true)
    try {
      // In real app, validate and redeem gift card
      const existingCard = giftCards.find((card) => card.code === redeemCode.trim())

      if (existingCard) {
        toast({
          title: "Gift Card Already in Account",
          description: `This gift card is already in your account with balance ₹${existingCard.balance}`,
          variant: "destructive",
        })
      } else {
        // Mock successful redemption
        const redeemedCard: GiftCard = {
          id: Date.now().toString(),
          code: redeemCode.trim(),
          amount: 1500,
          balance: 1500,
          purchaseDate: "2024-01-01",
          expiryDate: "2025-01-01",
          status: "active",
        }

        setGiftCards([redeemedCard, ...giftCards])
        setRedeemCode("")

        toast({
          title: "Gift Card Redeemed!",
          description: `Gift card worth ₹${redeemedCard.balance} has been added to your account.`,
        })
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to redeem gift card",
        variant: "destructive",
      })
    } finally {
      setIsRedeeming(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Gift card code copied to clipboard",
    })
  }

  const getStatusColor = (status: GiftCard["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "used":
        return "bg-gray-100 text-gray-800"
      case "expired":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const totalBalance = giftCards.filter((card) => card.status === "active").reduce((sum, card) => sum + card.balance, 0)

  if (loading || isLoading) {
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
              <Gift className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
              <p className="text-gray-600 mb-4">You need to be signed in to manage gift cards.</p>
              <Button onClick={() => (window.location.href = "/auth")}>Sign In</Button>
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
          <h1 className="text-3xl font-bold text-amber-800 mb-2">Gift Cards</h1>
          <p className="text-gray-600">Purchase and manage your gift cards</p>
        </div>

        {/* Gift Card Balance Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Total Gift Card Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-green-600">₹{totalBalance.toLocaleString("en-IN")}</div>
              <Badge variant="secondary">
                {giftCards.filter((card) => card.status === "active").length} active cards
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="my-cards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-cards">My Gift Cards</TabsTrigger>
            <TabsTrigger value="purchase">Purchase</TabsTrigger>
            <TabsTrigger value="redeem">Redeem</TabsTrigger>
          </TabsList>

          <TabsContent value="my-cards">
            {giftCards.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Gift Cards</h3>
                    <p className="text-gray-600 mb-4">You don't have any gift cards yet.</p>
                    <Button onClick={() => document.querySelector('[value="purchase"]')?.click()}>
                      Purchase Gift Card
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {giftCards.map((card) => (
                  <Card key={card.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">Gift Card</CardTitle>
                        <Badge className={getStatusColor(card.status)}>{card.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm opacity-90">Balance</span>
                          <Gift className="h-5 w-5" />
                        </div>
                        <div className="text-2xl font-bold">₹{card.balance.toLocaleString("en-IN")}</div>
                        <div className="text-sm opacity-90 mt-2">of ₹{card.amount.toLocaleString("en-IN")}</div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Code:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{card.code}</code>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(card.code)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Purchased:</span>
                          <span className="text-sm">{new Date(card.purchaseDate).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Expires:</span>
                          <span className="text-sm">{new Date(card.expiryDate).toLocaleDateString()}</span>
                        </div>

                        {card.recipientEmail && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Recipient:</span>
                            <span className="text-sm">{card.recipientEmail}</span>
                          </div>
                        )}

                        {card.message && (
                          <div className="pt-2 border-t">
                            <span className="text-sm text-gray-600">Message:</span>
                            <p className="text-sm mt-1 italic">"{card.message}"</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="purchase">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Purchase Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Gift Card</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="template">Choose Design</Label>
                    <div className="grid grid-cols-1 gap-3 mt-2">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            purchaseForm.selectedTemplate === template.id
                              ? "border-amber-500 bg-amber-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setPurchaseForm({ ...purchaseForm, selectedTemplate: template.id })}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={template.image || "/placeholder.svg"}
                              alt={template.name}
                              className="w-16 h-10 object-cover rounded"
                            />
                            <div>
                              <h4 className="font-medium">{template.name}</h4>
                              <p className="text-sm text-gray-600">{template.design}</p>
                            </div>
                            {purchaseForm.selectedTemplate === template.id && (
                              <Check className="h-5 w-5 text-amber-500 ml-auto" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {templates
                        .find((t) => t.id === purchaseForm.selectedTemplate)
                        ?.amounts.map((amount) => (
                          <Button
                            key={amount}
                            variant={purchaseForm.amount === amount ? "default" : "outline"}
                            onClick={() => setPurchaseForm({ ...purchaseForm, amount })}
                          >
                            ₹{amount}
                          </Button>
                        ))}
                    </div>
                    <Input
                      type="number"
                      value={purchaseForm.amount}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, amount: Number(e.target.value) })}
                      className="mt-2"
                      min="100"
                      max="50000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="senderName">Your Name</Label>
                    <Input
                      id="senderName"
                      value={purchaseForm.senderName}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, senderName: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="recipientEmail">Recipient Email (Optional)</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      value={purchaseForm.recipientEmail}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, recipientEmail: e.target.value })}
                      placeholder="recipient@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="recipientName">Recipient Name (Optional)</Label>
                    <Input
                      id="recipientName"
                      value={purchaseForm.recipientName}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, recipientName: e.target.value })}
                      placeholder="Recipient's name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Personal Message (Optional)</Label>
                    <textarea
                      id="message"
                      value={purchaseForm.message}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, message: e.target.value })}
                      placeholder="Add a personal message..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      rows={3}
                    />
                  </div>

                  <Button onClick={handlePurchaseGiftCard} disabled={isPurchasing} className="w-full">
                    {isPurchasing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Gift className="mr-2 h-4 w-4" />
                        Purchase Gift Card - ₹{purchaseForm.amount}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white p-6 rounded-lg">
                    <div className="text-center space-y-4">
                      <Gift className="h-12 w-12 mx-auto" />
                      <div>
                        <h3 className="text-xl font-bold">Gift Card</h3>
                        <p className="text-sm opacity-90">
                          {templates.find((t) => t.id === purchaseForm.selectedTemplate)?.name} Design
                        </p>
                      </div>
                      <div className="text-3xl font-bold">₹{purchaseForm.amount.toLocaleString("en-IN")}</div>
                      {purchaseForm.recipientName && <p className="text-sm">For: {purchaseForm.recipientName}</p>}
                      {purchaseForm.message && (
                        <p className="text-sm italic border-t border-white/20 pt-4">"{purchaseForm.message}"</p>
                      )}
                      {purchaseForm.senderName && <p className="text-sm">From: {purchaseForm.senderName}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="redeem">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-center">Redeem Gift Card</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="redeemCode">Gift Card Code</Label>
                  <Input
                    id="redeemCode"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                    placeholder="Enter gift card code"
                    className="font-mono"
                  />
                </div>

                <Button onClick={handleRedeemGiftCard} disabled={isRedeeming || !redeemCode.trim()} className="w-full">
                  {isRedeeming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Redeem Gift Card
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  <p>Enter the gift card code to add it to your account.</p>
                  <p className="mt-2">Gift cards are valid for 1 year from purchase date.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
