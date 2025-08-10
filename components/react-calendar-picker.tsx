"use client"

import { useState } from "react"
import Calendar from "react-calendar"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import "react-calendar/dist/Calendar.css"

interface ReactCalendarPickerProps {
  value?: Date
  onChange?: (date: Date) => void
  placeholder?: string
  className?: string
}

export function ReactCalendarPicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
}: ReactCalendarPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleDateChange = (date: Date | Date[] | null) => {
    if (date && !Array.isArray(date)) {
      onChange?.(date)
      setIsOpen(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <>
      <style jsx global>{`
        .react-calendar {
          border: 1px solid #f3e8ff;
          border-radius: 0.5rem;
          font-family: inherit;
        }
        .react-calendar__tile {
          border-radius: 0.25rem;
          transition: all 0.2s;
        }
        .react-calendar__tile:hover {
          background-color: #fef3c7;
        }
        .react-calendar__tile--active {
          background: linear-gradient(to right, #d97706, #eab308);
          color: white;
        }
        .react-calendar__tile--now {
          background-color: #fef3c7;
          color: #92400e;
        }
        .react-calendar__navigation button {
          color: #d97706;
          font-weight: 600;
        }
        .react-calendar__navigation button:hover {
          background-color: #fef3c7;
        }
      `}</style>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal border-amber-200 hover:bg-amber-50",
              !value && "text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-amber-600" />
            {value ? formatDate(value) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-amber-200" align="start">
          <Calendar onChange={handleDateChange} value={value} minDate={new Date()} className="border-0" />
        </PopoverContent>
      </Popover>
    </>
  )
}
