"use client"

import { useState } from "react"
import { NativeDatePicker } from "@/components/native-date-picker"
import { CustomDatePicker } from "@/components/custom-date-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Crown, Truck, Clock, Package } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function DeliverySchedulerPage() {
  const [deliveryDate, setDeliveryDate] = useState("")
  const [alternateDate, setAlternateDate] = useState<Date>()
  const [timeSlot, setTimeSlot] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [address, setAddress] = useState("")
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const timeSlots = ["9:00 AM - 12:00 PM", "12:00 PM - 3:00 PM", "3:00 PM - 6:00 PM", "6:00 PM - 9:00 PM"]

  // Get tomorrow's date as minimum delivery date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split("T")[0]

  // Get max date (30 days from now)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateString = maxDate.toISOString().split("T")[0]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!customerName.trim()) {
      newErrors.customerName = "Customer name is required"
    }

    if (!customerPhone.trim()) {
      newErrors.customerPhone = "Phone number is required"
    } else if (!/^\+?[\d\s-()]{10,}$/.test(customerPhone.trim())) {
      newErrors.customerPhone = "Please enter a valid phone number"
    }

    if (!address.trim()) {
      newErrors.address = "Delivery address is required"
    }

    if (!deliveryDate && !alternateDate) {
      newErrors.deliveryDate = "Please select a delivery date"
    }

    if (!timeSlot) {
      newErrors.timeSlot = "Please select a time slot"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleScheduleDelivery = () => {
    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "Some required fields are missing or invalid.",
        variant: "destructive",
      })
      return
    }

    const deliveryData = {
      customerName,
      customerPhone,
      address,
      deliveryDate: deliveryDate || alternateDate?.toISOString().split("T")[0],
      timeSlot,
      specialInstructions,
    }

    console.log("Delivery scheduled:", deliveryData)

    toast({
      title: "Delivery Scheduled!",
      description: `Your premium delivery has been scheduled for ${deliveryDate || alternateDate?.toLocaleDateString()}.`,
    })

    // Reset form
    setDeliveryDate("")
    setAlternateDate(undefined)
    setTimeSlot("")
    setCustomerName("")
    setCustomerPhone("")
    setAddress("")
    setSpecialInstructions("")
    setErrors({})
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-amber-600 mr-3" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Premium Delivery Service
              </h1>
            </div>
            <p className="text-gray-600">Schedule your heritage fashion delivery with our white-glove service</p>
          </div>

          <Card className="border-amber-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardTitle className="flex items-center text-amber-800">
                <Truck className="h-5 w-5 mr-2" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Customer Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-medium">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value)
                      if (errors.customerName) {
                        setErrors((prev) => ({ ...prev, customerName: "" }))
                      }
                    }}
                    placeholder="Enter your full name"
                    className={`border-amber-200 focus:border-amber-500 ${errors.customerName ? "border-red-300" : ""}`}
                  />
                  {errors.customerName && <p className="text-red-600 text-sm mt-1">{errors.customerName}</p>}
                </div>
                <div>
                  <Label htmlFor="phone" className="text-gray-700 font-medium">
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value)
                      if (errors.customerPhone) {
                        setErrors((prev) => ({ ...prev, customerPhone: "" }))
                      }
                    }}
                    placeholder="+91 98765 43210"
                    className={`border-amber-200 focus:border-amber-500 ${
                      errors.customerPhone ? "border-red-300" : ""
                    }`}
                  />
                  {errors.customerPhone && <p className="text-red-600 text-sm mt-1">{errors.customerPhone}</p>}
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <Label htmlFor="address" className="text-gray-700 font-medium">
                  Delivery Address *
                </Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value)
                    if (errors.address) {
                      setErrors((prev) => ({ ...prev, address: "" }))
                    }
                  }}
                  placeholder="Enter complete delivery address with landmarks"
                  className={`border-amber-200 focus:border-amber-500 ${errors.address ? "border-red-300" : ""}`}
                  rows={3}
                />
                {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
              </div>

              {/* Date Selection */}
              <div className="grid md:grid-cols-2 gap-6">
                <NativeDatePicker
                  label="Preferred Delivery Date"
                  value={deliveryDate}
                  onChange={(date) => {
                    setDeliveryDate(date)
                    if (errors.deliveryDate) {
                      setErrors((prev) => ({ ...prev, deliveryDate: "" }))
                    }
                  }}
                  placeholder="Select delivery date"
                  min={minDate}
                  max={maxDateString}
                  required
                  error={errors.deliveryDate}
                />

                <CustomDatePicker
                  label="Alternative Date"
                  value={alternateDate}
                  onChange={(date) => {
                    setAlternateDate(date)
                    if (errors.deliveryDate) {
                      setErrors((prev) => ({ ...prev, deliveryDate: "" }))
                    }
                  }}
                  placeholder="Pick alternative date"
                  minDate={tomorrow}
                  maxDate={maxDate}
                />
              </div>

              {/* Time Slot Selection */}
              <div>
                <Label className="text-gray-700 font-medium mb-3 block">
                  <Clock className="h-4 w-4 inline mr-2" />
                  Preferred Time Slot *
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot}
                      variant={timeSlot === slot ? "default" : "outline"}
                      onClick={() => {
                        setTimeSlot(slot)
                        if (errors.timeSlot) {
                          setErrors((prev) => ({ ...prev, timeSlot: "" }))
                        }
                      }}
                      className={
                        timeSlot === slot
                          ? "bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
                          : "border-amber-200 hover:bg-amber-50 bg-transparent"
                      }
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
                {errors.timeSlot && <p className="text-red-600 text-sm mt-1">{errors.timeSlot}</p>}
              </div>

              {/* Special Instructions */}
              <div>
                <Label htmlFor="instructions" className="text-gray-700 font-medium">
                  Special Delivery Instructions
                </Label>
                <Textarea
                  id="instructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special instructions for our delivery team (optional)"
                  className="border-amber-200 focus:border-amber-500"
                  rows={2}
                />
              </div>

              {/* Premium Service Info */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Package className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-2">Premium Delivery Service Includes:</h4>
                    <ul className="text-amber-700 text-sm space-y-1">
                      <li>• White-glove delivery with care</li>
                      <li>• Professional packaging and handling</li>
                      <li>• SMS and call notifications</li>
                      <li>• Flexible rescheduling options</li>
                      <li>• Contactless delivery available</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Schedule Button */}
              <Button
                onClick={handleScheduleDelivery}
                className="w-full bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 hover:from-amber-700 hover:via-yellow-700 hover:to-orange-700 text-white py-3 text-lg font-semibold shadow-lg"
              >
                Schedule Premium Delivery
              </Button>

              {/* Summary */}
              {(deliveryDate || alternateDate) && timeSlot && customerName && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Delivery Summary</h4>
                  <div className="text-green-700 text-sm space-y-1">
                    <p>
                      <strong>Customer:</strong> {customerName}
                    </p>
                    <p>
                      <strong>Phone:</strong> {customerPhone}
                    </p>
                    <p>
                      <strong>Date:</strong> {deliveryDate || alternateDate?.toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Time:</strong> {timeSlot}
                    </p>
                    {address && (
                      <p>
                        <strong>Address:</strong> {address}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
