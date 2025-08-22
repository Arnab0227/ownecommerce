"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/hooks/use-firebase-auth"
import { useToast } from "@/hooks/use-toast"
import { Gift, Star, Trophy, Crown, Zap, History, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface LoyaltyData {
  points: number
  tier: "Bronze" | "Silver" | "Gold" | "Platinum"
  tier_progress: number
  next_tier_points: number
  lifetime_points: number
  redeemable_points: number
}

interface Transaction {
  id: string
  type: "earned" | "redeemed"
  points: number
  description: string
  order_id?: string
  created_at: string
}

interface Reward {
  id: string
  name: string
  description: string
  points_required: number
  type: "discount" | "free_shipping" | "gift"
  value: number
  available: boolean
}

export default function LoyaltyPage() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) {
      loadLoyaltyData()
    } else if (!loading) {
      setIsLoading(false)
    }
  }, [loading, user])

  const loadLoyaltyData = async () => {
    try {
      setIsLoading(true)
      const [loyaltyResponse, transactionsResponse, rewardsResponse] = await Promise.all([
        fetch(`/api/loyalty/${user?.uid}`),
        fetch(`/api/loyalty/${user?.uid}/transactions`),
        fetch("/api/loyalty/rewards"),
      ])

      if (loyaltyResponse.ok) {
        const data = await loyaltyResponse.json()
        setLoyaltyData(data)
      }

      if (transactionsResponse.ok) {
        const data = await transactionsResponse.json()
        setTransactions(data.transactions || [])
      }

      if (rewardsResponse.ok) {
        const data = await rewardsResponse.json()
        setRewards(data.rewards || [])
      }
    } catch (error) {
      console.error("Error loading loyalty data:", error)
      // Mock data for demo
      const mockLoyaltyData: LoyaltyData = {
        points: 1250,
        tier: "Silver",
        tier_progress: 62.5,
        next_tier_points: 750,
        lifetime_points: 2800,
        redeemable_points: 1250,
      }

      const mockTransactions: Transaction[] = [
        {
          id: "1",
          type: "earned",
          points: 125,
          description: "Order purchase - Order #ORD001",
          order_id: "ORD001",
          created_at: "2024-01-10T14:30:00Z",
        },
        {
          id: "2",
          type: "redeemed",
          points: -500,
          description: "10% discount coupon redeemed",
          created_at: "2024-01-08T10:15:00Z",
        },
        {
          id: "3",
          type: "earned",
          points: 200,
          description: "Order purchase - Order #ORD002",
          order_id: "ORD002",
          created_at: "2024-01-05T16:45:00Z",
        },
      ]

      const mockRewards: Reward[] = [
        {
          id: "1",
          name: "5% Discount Coupon",
          description: "Get 5% off on your next purchase",
          points_required: 500,
          type: "discount",
          value: 5,
          available: true,
        },
        {
          id: "2",
          name: "10% Discount Coupon",
          description: "Get 10% off on your next purchase",
          points_required: 1000,
          type: "discount",
          value: 10,
          available: true,
        },
        {
          id: "3",
          name: "Free Shipping",
          description: "Free shipping on your next order",
          points_required: 750,
          type: "free_shipping",
          value: 0,
          available: true,
        },
        {
          id: "4",
          name: "15% Discount Coupon",
          description: "Get 15% off on your next purchase",
          points_required: 1500,
          type: "discount",
          value: 15,
          available: false,
        },
      ]

      setLoyaltyData(mockLoyaltyData)
      setTransactions(mockTransactions)
      setRewards(mockRewards)
    } finally {
      setIsLoading(false)
    }
  }

  const redeemReward = async (rewardId: string, pointsRequired: number) => {
    if (!loyaltyData || loyaltyData.redeemable_points < pointsRequired) {
      toast({
        title: "Insufficient Points",
        description: `You need ${pointsRequired} points to redeem this reward. You have ${loyaltyData?.redeemable_points || 0} points.`,
        variant: "destructive",
      })
      return
    }

    try {
      setIsRedeeming(rewardId)
      const response = await fetch("/api/loyalty/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.uid,
          rewardId,
          pointsRequired,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        // Update loyalty data
        setLoyaltyData((prev) =>
          prev
            ? {
                ...prev,
                points: prev.points - pointsRequired,
                redeemable_points: prev.redeemable_points - pointsRequired,
              }
            : null,
        )

        // Add transaction
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          type: "redeemed",
          points: -pointsRequired,
          description: `${rewards.find((r) => r.id === rewardId)?.name} redeemed`,
          created_at: new Date().toISOString(),
        }
        setTransactions((prev) => [newTransaction, ...prev])

        toast({
          title: "Reward Redeemed Successfully!",
          description: result.message || "Your reward has been added to your account.",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to redeem reward")
      }
    } catch (error) {
      console.error("Error redeeming reward:", error)
      toast({
        title: "Redemption Failed",
        description: "Failed to redeem reward. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRedeeming(null)
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "Bronze":
        return <Star className="h-5 w-5 text-amber-600" />
      case "Silver":
        return <Trophy className="h-5 w-5 text-gray-500" />
      case "Gold":
        return <Crown className="h-5 w-5 text-yellow-500" />
      case "Platinum":
        return <Zap className="h-5 w-5 text-purple-600" />
      default:
        return <Star className="h-5 w-5 text-gray-400" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Bronze":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "Silver":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "Gold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Platinum":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

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
              <Gift className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Login Required</h2>
              <p className="text-gray-600 mb-4">Please login to view your loyalty points and rewards.</p>
              <Button onClick={() => (window.location.href = "/auth")}>Login</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!loyaltyData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Loyalty Data</h2>
              <p className="text-gray-600">Start shopping to earn loyalty points!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-800 mb-2">Loyalty Program</h1>
          <p className="text-gray-600">Earn points with every purchase and unlock exclusive rewards</p>
        </div>

        {/* Loyalty Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Points</p>
                  <p className="text-3xl font-bold text-orange-600">{loyaltyData.points.toLocaleString()}</p>
                </div>
                <Gift className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-sm text-gray-600">
                {loyaltyData.redeemable_points.toLocaleString()} points available for redemption
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Tier</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getTierIcon(loyaltyData.tier)}
                    <Badge className={getTierColor(loyaltyData.tier)}>{loyaltyData.tier}</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to next tier</span>
                  <span>{loyaltyData.tier_progress.toFixed(0)}%</span>
                </div>
                <Progress value={loyaltyData.tier_progress} className="h-2" />
                <p className="text-xs text-gray-600">{loyaltyData.next_tier_points} more points to next tier</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Lifetime Points</p>
                  <p className="text-3xl font-bold text-green-600">{loyaltyData.lifetime_points.toLocaleString()}</p>
                </div>
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Total points earned all time</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rewards">Available Rewards</TabsTrigger>
            <TabsTrigger value="history">Points History</TabsTrigger>
          </TabsList>

          <TabsContent value="rewards">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((reward) => (
                <Card key={reward.id} className={!reward.available ? "opacity-60" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{reward.name}</span>
                      <Badge variant={reward.available ? "default" : "secondary"}>{reward.points_required} pts</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{reward.description}</p>

                    {reward.type === "discount" && (
                      <div className="bg-green-50 p-3 rounded-lg mb-4">
                        <p className="text-green-800 font-semibold">{reward.value}% OFF</p>
                      </div>
                    )}

                    {reward.type === "free_shipping" && (
                      <div className="bg-blue-50 p-3 rounded-lg mb-4">
                        <p className="text-blue-800 font-semibold">FREE SHIPPING</p>
                      </div>
                    )}

                    <Button
                      onClick={() => redeemReward(reward.id, reward.points_required)}
                      disabled={
                        !reward.available ||
                        loyaltyData.redeemable_points < reward.points_required ||
                        isRedeeming === reward.id
                      }
                      className="w-full"
                      variant={loyaltyData.redeemable_points >= reward.points_required ? "default" : "outline"}
                    >
                      {isRedeeming === reward.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Redeeming...
                        </>
                      ) : loyaltyData.redeemable_points >= reward.points_required ? (
                        "Redeem Now"
                      ) : (
                        `Need ${reward.points_required - loyaltyData.redeemable_points} more points`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Points History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.created_at).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <span className={transaction.points > 0 ? "text-green-600" : "text-red-600"}>
                            {transaction.points > 0 ? "+" : ""}
                            {transaction.points}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === "earned" ? "default" : "secondary"}>
                            {transaction.type}
                          </Badge>
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
