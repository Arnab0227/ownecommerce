"use client"

import { useState } from "react"
import { CalendarIcon, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface NativeDatePickerProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  className?: string
  min?: string
  max?: string
  required?: boolean
  error?: string
  label?: string
}

export function NativeDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className,
  min,
  max,
  required = false,
  error,
  label,
}: NativeDatePickerProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          min={min}
          max={max}
          required={required}
          className={cn(
            "w-full px-3 py-2 pr-10 border rounded-lg transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500",
            "hover:border-amber-300",
            "bg-white text-gray-900",
            "appearance-none",
            error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-amber-200",
            focused && "ring-2 ring-amber-500 border-amber-500",
            className,
          )}
          style={{
            colorScheme: "light",
          }}
        />
        <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-600 pointer-events-none" />
      </div>
      {error && (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
