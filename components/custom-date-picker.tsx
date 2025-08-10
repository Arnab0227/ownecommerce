"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, CalendarIcon, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface CustomDatePickerProps {
  value?: Date
  onChange?: (date: Date) => void
  placeholder?: string
  className?: string
  minDate?: Date
  maxDate?: Date
  error?: string
  label?: string
  required?: boolean
}

export function CustomDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  minDate,
  maxDate,
  error,
  label,
  required = false,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(value || new Date())

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString()
  }

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return
    onChange?.(date)
    setIsOpen(false)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleMonthChange = (monthIndex: string) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(Number.parseInt(monthIndex))
      return newDate
    })
  }

  const handleYearChange = (year: string) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setFullYear(Number.parseInt(year))
      return newDate
    })
  }

  const days = getDaysInMonth(currentMonth)
  const currentYear = currentMonth.getFullYear()
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i)

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal transition-all duration-200",
              "hover:bg-amber-50",
              !value && "text-muted-foreground",
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-amber-200 focus:border-amber-500",
              className,
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-amber-600" />
            {value ? formatDate(value) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 border-amber-200" align="start">
          <Card className="border-0 shadow-none">
            <CardContent className="p-4">
              {/* Header with month/year selectors */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                  className="h-8 w-8 p-0 hover:bg-amber-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center space-x-2">
                  <Select value={currentMonth.getMonth().toString()} onValueChange={handleMonthChange}>
                    <SelectTrigger className="w-32 h-8 border-amber-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-20 h-8 border-amber-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("next")}
                  className="h-8 w-8 p-0 hover:bg-amber-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                  <div key={index} className="aspect-square">
                    {day && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDateSelect(day)}
                        disabled={isDateDisabled(day)}
                        className={cn(
                          "h-full w-full p-0 text-sm hover:bg-amber-50 transition-colors",
                          isToday(day) && "bg-amber-100 text-amber-900 font-semibold",
                          value &&
                            isSameDay(day, value) &&
                            "bg-gradient-to-r from-amber-600 to-yellow-600 text-white hover:from-amber-700 hover:to-yellow-700",
                          isDateDisabled(day) && "opacity-50 cursor-not-allowed hover:bg-transparent",
                        )}
                      >
                        {day.getDate()}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
      {error && (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
