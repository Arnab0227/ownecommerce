/**
 * Formats a given date or date string to a standardized Indian date-time format.
 * @param date - The date or date string to format.
 * @returns The formatted date-time string in Indian timezone or an error message.
 */
export const formatDateTimeIndia = (date: Date | string): string => {
  let dateObj: Date

  if (typeof date === "string") {
    // Handle ISO strings with timezone info
    dateObj = new Date(date)
  } else {
    dateObj = date
  }

  if (isNaN(dateObj.getTime())) {
    return "Invalid date"
  }

  return (
    dateObj.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true, // Use 12-hour format with AM/PM
    }) + " IST"
  )
}

/**
 * Formats a given date or date string to a standardized Indian date format.
 * @param date - The date or date string to format.
 * @returns The formatted date string in Indian timezone or an error message.
 */
export const formatDateIndia = (date: Date | string): string => {
  let dateObj: Date

  if (typeof date === "string") {
    dateObj = new Date(date)
  } else {
    dateObj = date
  }

  if (isNaN(dateObj.getTime())) {
    return "Invalid date"
  }

  return dateObj.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/**
 * Formats a given date or date string to a standardized Indian time format.
 * @param date - The date or date string to format.
 * @returns The formatted time string in Indian timezone or an error message.
 */
export const formatTimeIndia = (date: Date | string): string => {
  let dateObj: Date

  if (typeof date === "string") {
    dateObj = new Date(date)
  } else {
    dateObj = date
  }

  if (isNaN(dateObj.getTime())) {
    return "Invalid date"
  }

  return dateObj.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export const getCurrentISTTime = (): Date => {
  return new Date()
}

export const convertToIST = (date: Date | string): Date => {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return new Date(dateObj.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
}
