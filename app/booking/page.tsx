"use client"

import { useState } from "react"
import { NativeDatePicker } from "@/components/native-date-picker"
import { CustomDatePicker } from "@/components/custom-date-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Crown, Calendar, Clock, MapPin } from "lucide-react"

export default function BookingPage() {
  const [appointmentDate, setAppointmentDate] = useState("")
  const [customDate, setCustomDate] = useState<Date>()
  const [timeSlot, setTimeSlot] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")

  const timeSlots = ["10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"]

  const handleBooking = () => {
    console.log({
      appointmentDate,
      customDate,
      timeSlot,
      customerName,
      customerPhone,
    })
  }

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-amber-600 mr-3" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Book Your Heritage Experience
              </h1>
            </div>
            <p className="text-gray-600">Schedule a personal consultation at our heritage boutique</p>
          </div>

          <Card className="border-amber-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardTitle className="flex items-center text-amber-800">
                <Calendar className="h-5 w-5 mr-2" />
                Appointment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your full name"
                    className="border-amber-200 focus:border-amber-500"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-gray-700 font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="border-amber-200 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-700 font-medium mb-3 block">Preferred Date (Native Date Picker)</Label>
                <NativeDatePicker
                  value={appointmentDate}
                  onChange={setAppointmentDate}
                  placeholder="Select appointment date"
                  min={today}
                />
              </div>

              <div>
                <Label className="text-gray-700 font-medium mb-3 block">Alternative Date (Custom Date Picker)</Label>
                <CustomDatePicker value={customDate} onChange={setCustomDate} placeholder="Pick an alternative date" />
              </div>

              <div>
                <Label className="text-gray-700 font-medium mb-3 block">
                  <Clock className="h-4 w-4 inline mr-2" />
                  Preferred Time Slot
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot}
                      variant={timeSlot === slot ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeSlot(slot)}
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
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-1">Visit Our Heritage Store</h4>
                    <p className="text-amber-700 text-sm">
                      123 Fashion Street, Mumbai
                      <br />
                      Maharashtra 400001
                      <br />
                      +91 98765 43210
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleBooking}
                className="w-full bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 hover:from-amber-700 hover:via-yellow-700 hover:to-orange-700 text-white py-3 text-lg font-semibold shadow-lg"
                disabled={!customerName || !customerPhone || (!appointmentDate && !customDate) || !timeSlot}
              >
                Book Your Heritage Experience
              </Button>

              {(appointmentDate || customDate) && timeSlot && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Booking Summary</h4>
                  <p className="text-green-700 text-sm">
                    <strong>Date:</strong> {appointmentDate || (customDate && customDate.toLocaleDateString())}
                    <br />
                    <strong>Time:</strong> {timeSlot}
                    <br />
                    <strong>Name:</strong> {customerName}
                    <br />
                    <strong>Phone:</strong> {customerPhone}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
