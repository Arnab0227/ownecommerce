"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-firebase-auth"
import { useToast } from "@/hooks/use-toast"
import { Loader2, MapPin, CreditCard, Truck, Shield, Plus, AlertCircle } from 'lucide-react'
import { addPurchase } from "@/lib/local-storage-purchases"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface Address {
  id: string
  name: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  isDefault?: boolean
}

interface PaymentSettings {
  razorpay_enabled: boolean
  cod_enabled: boolean
}

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, getTotalPrice, clearCart, isLoaded } = useCart()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    razorpay_enabled: false,
    cod_enabled: true,
  })
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null)

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState("")
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    saveAddress: false,
  })

  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [orderNote, setOrderNote] = useState("")

  const totalAmount = getTotalPrice()
  const shippingFee = totalAmount >= 699 ? 0 : 70
  const finalAmount = totalAmount + shippingFee

  useEffect(() => {
    const initializeCheckout = async () => {
      console.log("[v0] Initializing checkout...")
      console.log("[v0] User:", user?.email || "not logged in")
      console.log("[v0] Items count:", items.length)
      console.log("[v0] Cart loaded:", isLoaded)

      if (!isLoaded) {
        console.log("[v0] Cart still loading, waiting...")
        return
      }

      if (!user) {
        console.log("[v0] No user found, redirecting to auth")
        router.push("/auth")
        return
      }

      if (items.length === 0) {
        console.log("[v0] No items in cart, redirecting to cart")
        router.push("/cart")
        return
      }

      console.log("[v0] Checkout initialized successfully")
      loadPaymentSettings()
      await loadRazorpayPublicKey()
      loadAddresses()
      loadRazorpayScript()
    }

    initializeCheckout()
  }, [user, items.length, isLoaded, router])

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const existingScript = document.getElementById("razorpay-script")

      if (!existingScript) {
        const script = document.createElement("script")
        script.id = "razorpay-script"
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.onload = () => {
          console.log("[v0] Razorpay script loaded successfully")
          resolve(true)
        }
        script.onerror = () => {
          console.error("[v0] Failed to load Razorpay script")
          toast({
            title: "Payment Error",
            description: "Failed to load payment system. Please refresh the page.",
            variant: "destructive",
          })
          resolve(false)
        }
        document.body.appendChild(script)
      } else {
        console.log("[v0] Razorpay script already loaded")
        resolve(true)
      }
    })
  }

  const loadPaymentSettings = async () => {
    try {
      console.log("[v0] Loading payment settings...")
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Payment settings loaded:", data)
        const payments = data.payments || { razorpay_enabled: false, cod_enabled: true }
        setPaymentSettings(payments)

        // Set default payment method based on available options
        if (payments.razorpay_enabled) {
          setPaymentMethod("razorpay")
        } else if (payments.cod_enabled) {
          setPaymentMethod("cod")
        }
      } else {
        console.error("[v0] Failed to load payment settings:", response.status)
      }
    } catch (error) {
      console.error("Error loading payment settings:", error)
    }
  }

  const loadAddresses = () => {
    const saved = localStorage.getItem(`addresses_${user?.uid}`)
    if (saved) {
      const parsedAddresses = JSON.parse(saved)
      setAddresses(parsedAddresses)

      // Auto-select default address
      const defaultAddress = parsedAddresses.find((addr: Address) => addr.isDefault)
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id)
      }
    }
  }

  const loadRazorpayPublicKey = async () => {
    try {
      const res = await fetch("/api/config/razorpay")
      if (!res.ok) throw new Error("Failed to load Razorpay config")
      const { enabled, keyId } = await res.json()
      setRazorpayKeyId(enabled ? keyId : null)
    } catch (e) {
      console.error("[v0] Unable to fetch Razorpay key id:", e)
      setRazorpayKeyId(null)
    }
  }

  const saveAddress = () => {
    if (
      !addressForm.name ||
      !addressForm.phone ||
      !addressForm.address ||
      !addressForm.city ||
      !addressForm.state ||
      !addressForm.pincode
    ) {
      toast({
        title: "Error",
        description: "Please fill all address fields",
        variant: "destructive",
      })
      return
    }

    if (editingAddressId) {
      const updatedAddresses = addresses.map((addr) =>
        addr.id === editingAddressId ? { ...addr, ...addressForm } : addr,
      )
      setAddresses(updatedAddresses)

      if (addressForm.saveAddress) {
        localStorage.setItem(`addresses_${user?.uid}`, JSON.stringify(updatedAddresses))
      }

      toast({
        title: "Success",
        description: "Address updated successfully",
      })
      setEditingAddressId(null)
    } else {
      const newAddress: Address = {
        id: Math.floor(Math.random() * 1000000).toString(),
        ...addressForm,
        isDefault: addresses.length === 0, // First address is default
      }

      const updatedAddresses = [...addresses, newAddress]
      setAddresses(updatedAddresses)
      setSelectedAddressId(newAddress.id)

      if (addressForm.saveAddress) {
        localStorage.setItem(`addresses_${user?.uid}`, JSON.stringify(updatedAddresses))
      }

      toast({
        title: "Success",
        description: "Address added successfully",
      })
    }

    // Reset form
    setAddressForm({
      name: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      saveAddress: false,
    })
    setShowAddressForm(false)
  }

  const fetchCityState = async (pincode: string) => {
    if (pincode.length === 6) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
        const data = await response.json()

        if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
          const postOffice = data[0].PostOffice[0]
          setAddressForm((prev) => ({
            ...prev,
            city: postOffice.District,
            state: postOffice.State,
          }))
        }
      } catch (error) {
        console.error("Error fetching city/state:", error)
      }
    }
  }

  const handleRazorpayPayment = async () => {
    try {
      setLoading(true)
      console.log("[v0] Starting Razorpay payment process...")

      if (!razorpayKeyId) {
        console.error("[v0] Razorpay key id unavailable")
        toast({
          title: "Configuration Error",
          description:
            "Payment system not configured. Please set RAZORPAY_KEY_ID in Project Settings, then reload this page.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded || !window.Razorpay) {
        console.error("[v0] Razorpay script not loaded properly")
        toast({
          title: "Payment Error",
          description: "Payment system failed to load. Please refresh and try again.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      console.log("[v0] Creating Razorpay order with amount:", finalAmount)

      const orderResponse = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          currency: "INR",
          notes: { market: "India", currency_enforced: "INR" },
        }),
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Order creation failed:", orderResponse.status, errorData)
        toast({
          title: "Order Creation Failed",
          description: `Failed to create payment order: ${errorData.error || orderResponse.status}`,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const razorpayOrderData = await orderResponse.json()
      console.log("[v0] Razorpay order created:", razorpayOrderData)

      const databaseOrder = await createOrderInDatabase("pending", razorpayOrderData.id)
      if (!databaseOrder) {
        toast({
          title: "Order Creation Failed",
          description: "Failed to create order in database. Please try again.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId)

      const options = {
        key: razorpayKeyId,
        amount: razorpayOrderData.amount,
        currency: "INR",
        name: "Suktara", // Updated brand name from Golden Threads to Suktara
        description: "Order Payment (INR Only)",
        order_id: razorpayOrderData.id,
        receipt: `receipt_${Math.floor(Math.random() * 1000000)}`,
        handler: async (response: any) => {
          try {
            console.log("[v0] Payment successful, verifying...")
            const verifyResponse = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            if (verifyResponse.ok) {
              console.log("[v0] Payment verified, clearing cart and redirecting...")
              if (!user) {
                items.forEach((item) => {
                  addPurchase({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    original_price: item.original_price,
                    imageUrl: item.imageUrl,
                    category: item.category,
                  })
                })
              }
              clearCart()
              toast({
                title: "Payment Successful!",
                description: "Order has been placed successfully.",
              })
              router.push(`/order-status?orderId=${databaseOrder.id}`)
            } else {
              const errorText = await verifyResponse.text()
              console.error("[v0] Payment verification failed:", errorText)
              toast({
                title: "Payment Processing",
                description: "Payment is being verified. Please check your order status.",
              })
              router.push(`/order-status?orderId=${databaseOrder.id}`)
            }
          } catch (error) {
            console.error("[v0] Payment verification error:", error)
            toast({
              title: "Payment Processing",
              description: "Payment is being verified. Please check your order status.",
            })
            router.push(`/order-status?orderId=${databaseOrder.id}`)
          }
        },
        prefill: {
          name: selectedAddress?.name || user?.displayName || "",
          email: user?.email || "",
          contact: selectedAddress?.phone || "",
        },
        theme: {
          color: "#ea580c", // Updated to match Suktara brand colors
        },
        method: {
          card: true,
          netbanking: true,
          wallet: true,
          upi: true,
          paylater: true,
        },
        config: {
          display: {
            language: "en",
          },
        },
        modal: {
          ondismiss: () => {
            console.log("[v0] Payment modal dismissed by user")
            setLoading(false)
            toast({
              title: "Payment Cancelled",
              description: "You can complete your payment anytime from your orders page.",
            })
          },
        },
      }

      console.log("[v0] Opening Razorpay modal...")
      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error("[v0] Razorpay payment error:", error)
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const createOrderInDatabase = async (paymentStatus: "pending" | "paid", razorpayOrderId?: string) => {
    try {
      const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId)
      if (!selectedAddress) {
        throw new Error("Please select a delivery address")
      }

      const orderData = {
        user_id: user?.uid,
        user_email: user?.email,
        items: items.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total_amount: finalAmount,
        delivery_fee: shippingFee,
        shipping_address: selectedAddress,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        razorpay_order_id: razorpayOrderId || null,
        user_notes: orderNote || null,
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const order = await response.json()
        console.log("[v0] Order created in database:", order.id)
        return order
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Order creation failed:", errorData)
        throw new Error(errorData.error || "Failed to create order")
      }
    } catch (error) {
      console.error("Order creation error:", error)
      toast({
        title: "Order Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create order",
        variant: "destructive",
      })
      return null
    }
  }

  const createOrder = async (paymentStatus: "pending" | "paid") => {
    try {
      const order = await createOrderInDatabase(paymentStatus)
      if (!order) {
        return // Error already handled in createOrderInDatabase
      }
      if (!user) {
        items.forEach((item) => {
          addPurchase({
            id: item.id,
            name: item.name,
            price: item.price,
            original_price: item.original_price,
            imageUrl: item.imageUrl,
            category: item.category,
          })
        })
      }
      clearCart()
      toast({
        title: "Success!",
        description: "Order has been placed successfully.",
      })
      router.push(`/order-status?orderId=${order.id}`)
    } catch (error) {
      console.error("Order creation error:", error)
      toast({
        title: "Order Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handlePlaceOrder = async () => {
    console.log("[v0] Place order clicked, payment method:", paymentMethod)
    console.log("[v0] Payment settings:", paymentSettings)
    console.log("[v0] COD enabled:", paymentSettings.cod_enabled)
    console.log("[v0] Razorpay key loaded:", Boolean(razorpayKeyId))
    console.log("[v0] Selected address ID:", selectedAddressId)
    console.log("[v0] Items in cart:", items.length)
    console.log("[v0] Final amount:", finalAmount)

    if (!selectedAddressId) {
      console.log("[v0] No address selected")
      toast({
        title: "Error",
        description: "Please select a delivery address",
        variant: "destructive",
      })
      return
    }

    if (finalAmount <= 0) {
      toast({
        title: "Invalid Order",
        description: "Order amount must be greater than zero.",
        variant: "destructive",
      })
      return
    }

    if (paymentMethod === "razorpay") {
      if (!paymentSettings.razorpay_enabled) {
        console.log("[v0] Razorpay disabled in settings")
        toast({
          title: "Payment Method Unavailable",
          description: "Online payments are currently disabled. Please contact admin or use COD.",
          variant: "destructive",
        })
        return
      }

      if (!razorpayKeyId) {
        toast({
          title: "Configuration Error",
          description:
            "Payment system not configured. Please set RAZORPAY_KEY_ID in Project Settings, then reload this page.",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Processing Razorpay payment...")
      await handleRazorpayPayment()
    } else if (paymentMethod === "cod") {
      if (!paymentSettings.cod_enabled) {
        console.log("[v0] COD disabled in settings")
        toast({
          title: "Payment Method Unavailable",
          description: "Cash on Delivery is currently disabled. Please use online payment.",
          variant: "destructive",
        })
        return
      }
      console.log("[v0] Processing COD order...")
      setLoading(true)
      await createOrder("pending")
      setLoading(false)
    } else {
      console.error("[v0] Invalid payment method:", paymentMethod)
      toast({
        title: "Error",
        description: "Please select a valid payment method",
        variant: "destructive",
      })
    }
  }

  const editAddress = (address: Address) => {
    setAddressForm({
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      saveAddress: false,
    })
    setEditingAddressId(address.id)
    setShowAddressForm(true)
  }

  const setDefaultAddress = (addressId: string) => {
    const updatedAddresses = addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === addressId,
    }))
    setAddresses(updatedAddresses)
    localStorage.setItem(`addresses_${user?.uid}`, JSON.stringify(updatedAddresses))

    toast({
      title: "Success",
      description: "Default address updated",
    })
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          {!razorpayKeyId && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div className="text-sm text-yellow-800">
                  <strong>Configuration Required:</strong> Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Project
                  Settings to enable Razorpay payments.
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addresses.length > 0 && (
                    <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                      {addresses.map((address) => (
                        <div key={address.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor={address.id} className="cursor-pointer">
                              <div className="font-medium">{address.name}</div>
                              <div className="text-sm text-gray-600">{address.phone}</div>
                              <div className="text-sm text-gray-600">
                                {address.address}, {address.city}, {address.state} - {address.pincode}
                              </div>
                              {address.isDefault && (
                                <div className="text-xs text-blue-600 font-medium">Default Address</div>
                              )}
                            </Label>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => editAddress(address)}
                              className="text-xs px-2 py-1"
                            >
                              Edit
                            </Button>
                            {!address.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDefaultAddress(address.id)}
                                className="text-xs px-2 py-1"
                              >
                                Set Default
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {!showAddressForm ? (
                    <Button variant="outline" onClick={() => setShowAddressForm(true)} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Address
                    </Button>
                  ) : (
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                      <h3 className="font-medium">{editingAddressId ? "Edit Address" : "Add New Address"}</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={addressForm.name}
                            onChange={(e) => setAddressForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter full name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={addressForm.address}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, address: e.target.value }))}
                          placeholder="House no, Building, Street, Area"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="pincode">Pincode</Label>
                          <Input
                            id="pincode"
                            value={addressForm.pincode}
                            onChange={(e) => {
                              const value = e.target.value
                              setAddressForm((prev) => ({ ...prev, pincode: value }))
                              fetchCityState(value)
                            }}
                            placeholder="Enter pincode"
                            maxLength={6}
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                            placeholder="Enter city"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Select
                            value={addressForm.state}
                            onValueChange={(value) => setAddressForm((prev) => ({ ...prev, state: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                              <SelectItem value="Arunachal Pradesh">Arunachal Pradesh</SelectItem>
                              <SelectItem value="Assam">Assam</SelectItem>
                              <SelectItem value="Bihar">Bihar</SelectItem>
                              <SelectItem value="Chhattisgarh">Chhattisgarh</SelectItem>
                              <SelectItem value="Goa">Goa</SelectItem>
                              <SelectItem value="Gujarat">Gujarat</SelectItem>
                              <SelectItem value="Haryana">Haryana</SelectItem>
                              <SelectItem value="Himachal Pradesh">Himachal Pradesh</SelectItem>
                              <SelectItem value="Jharkhand">Jharkhand</SelectItem>
                              <SelectItem value="Karnataka">Karnataka</SelectItem>
                              <SelectItem value="Kerala">Kerala</SelectItem>
                              <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                              <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                              <SelectItem value="Manipur">Manipur</SelectItem>
                              <SelectItem value="Meghalaya">Meghalaya</SelectItem>
                              <SelectItem value="Mizoram">Mizoram</SelectItem>
                              <SelectItem value="Nagaland">Nagaland</SelectItem>
                              <SelectItem value="Odisha">Odisha</SelectItem>
                              <SelectItem value="Punjab">Punjab</SelectItem>
                              <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                              <SelectItem value="Sikkim">Sikkim</SelectItem>
                              <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                              <SelectItem value="Telangana">Telangana</SelectItem>
                              <SelectItem value="Tripura">Tripura</SelectItem>
                              <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                              <SelectItem value="Uttarakhand">Uttarakhand</SelectItem>
                              <SelectItem value="West Bengal">West Bengal</SelectItem>
                              <SelectItem value="Delhi">Delhi</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="saveAddress"
                          checked={addressForm.saveAddress}
                          onCheckedChange={(checked) =>
                            setAddressForm((prev) => ({ ...prev, saveAddress: checked as boolean }))
                          }
                        />
                        <Label htmlFor="saveAddress" className="text-sm">
                          Save this address for future orders
                        </Label>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={saveAddress} className="flex-1">
                          {editingAddressId ? "Update Address" : "Save Address"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddressForm(false)
                            setEditingAddressId(null)
                            setAddressForm({
                              name: "",
                              phone: "",
                              address: "",
                              city: "",
                              state: "",
                              pincode: "",
                              saveAddress: false,
                            })
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="order_note">Order Notes (optional)</Label>
                    <textarea
                      id="order_note"
                      className="w-full border rounded-md p-2 text-sm"
                      rows={3}
                      placeholder="Any special instructions for delivery..."
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    {paymentSettings.razorpay_enabled && (
                      <div className="flex items-center space-x-3 p-3 border rounded-lg">
                        <RadioGroupItem value="razorpay" id="razorpay" />
                        <div className="flex-1">
                          <Label htmlFor="razorpay" className="cursor-pointer">
                            <div className="font-medium">Online Payment</div>
                            <div className="text-sm text-gray-600">Credit/Debit Cards, UPI, Net Banking, Wallets</div>
                          </Label>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-green-600">Secure</span>
                        </div>
                      </div>
                    )}

                    {paymentSettings.cod_enabled && (
                      <div className="flex items-center space-x-3 p-3 border rounded-lg">
                        <RadioGroupItem value="cod" id="cod" />
                        <div className="flex-1">
                          <Label htmlFor="cod" className="cursor-pointer">
                            <div className="font-medium">Cash on Delivery</div>
                            <div className="text-sm text-gray-600">Pay when your order is delivered</div>
                          </Label>
                        </div>
                        <Truck className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                  </RadioGroup>

                  {!paymentSettings.razorpay_enabled && !paymentSettings.cod_enabled && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm text-red-800">
                        No payment methods are currently enabled. Please contact support.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={`${item.id}-${index}`} className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-gray-600">Qty: {item.quantity}</div>
                        </div>
                        <div className="font-medium">₹{(item.price * item.quantity).toLocaleString("en-IN")}</div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>
                        {shippingFee === 0 ? <span className="text-green-600">Free</span> : `₹${shippingFee}`}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>₹{finalAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handlePlaceOrder}
                    disabled={
                      loading ||
                      !selectedAddressId ||
                      (!paymentSettings.razorpay_enabled && !paymentSettings.cod_enabled)
                    }
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Place Order - ₹${finalAmount.toLocaleString("en-IN")}`
                    )}
                  </Button>

                  {totalAmount < 699 && (
                    <div className="text-xs text-center text-gray-600">
                      Add ₹{(699 - totalAmount).toLocaleString("en-IN")} more for free shipping
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
