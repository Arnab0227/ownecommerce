"use client"

import { useState } from "react"
import { DatePicker } from "@/components/date-picker"
import { DateRangePicker } from "@/components/date-range-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DateRange } from "react-day-picker"

export default function ExampleDatePickerPage() {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              Date Picker Examples
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Single Date Picker</h3>
              <DatePicker date={selectedDate} onDateChange={setSelectedDate} placeholder="Select your preferred date" />
              {selectedDate && (
                <p className="mt-2 text-sm text-gray-600">Selected: {selectedDate.toLocaleDateString()}</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Date Range Picker</h3>
              <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} placeholder="Select date range" />
              {dateRange?.from && (
                <p className="mt-2 text-sm text-gray-600">
                  Range: {dateRange.from.toLocaleDateString()}
                  {dateRange.to && ` - ${dateRange.to.toLocaleDateString()}`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
