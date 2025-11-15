import { neon } from "@neondatabase/serverless"
import { auth } from "./firebase-client"
import { getIdTokenResult } from "firebase/auth"

const ADMIN_EMAILS = [
  "arnab0227@gmail.com",
  "santanubhatta12@gmail.com"
]

// Helper to get SQL client
function getSqlClient() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error("[v0] DATABASE_URL not configured")
    return null
  }
  return neon(databaseUrl)
}

// Check if user is admin by querying the database
export async function isUserAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) {
    return false
  }

  // Check against configured admin emails
  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase())
  console.log(`[v0] Admin check for ${email}: ${isAdmin ? "ADMIN" : "USER"}`)
  return isAdmin
}

// Get user custom claims (for advanced use)
export async function getUserAdminClaims(user: any) {
  if (!user) return null
  
  try {
    const idTokenResult = await getIdTokenResult(user, true)
    return idTokenResult.claims.admin || false
  } catch (error) {
    console.error("[v0] Error getting user claims:", error)
    return false
  }
}

// Get all admin users
export function getAllAdmins() {
  return ADMIN_EMAILS.map((email) => ({
    email,
    id: email,
    name: email.split("@")[0],
  }))
}

// Promote user to admin
export async function makeUserAdmin(email: string): Promise<{ success: boolean; message: string }> {
  const normalizedEmail = email.toLowerCase()

  if (ADMIN_EMAILS.includes(normalizedEmail)) {
    return { success: false, message: "User is already an admin" }
  }

  // In production, this would call an API to update Firebase Custom Claims
  // For now, return instruction message
  console.log(`[v0] To make ${email} an admin, add to NEXT_PUBLIC_ADMIN_EMAILS env var`)
  return { 
    success: false, 
    message: `Contact system admin to add ${email} as admin. Update NEXT_PUBLIC_ADMIN_EMAILS environment variable.` 
  }
}

// Demote admin to user
export async function removeAdminRole(email: string): Promise<{ success: boolean; message: string }> {
  const normalizedEmail = email.toLowerCase()

  if (!ADMIN_EMAILS.includes(normalizedEmail)) {
    return { success: false, message: "User is not an admin" }
  }

  if (ADMIN_EMAILS.length <= 1) {
    return { success: false, message: "Cannot remove the last admin" }
  }

  // In production, this would call an API to update Firebase Custom Claims
  // For now, return instruction message
  console.log(`[v0] To remove ${email} as admin, remove from NEXT_PUBLIC_ADMIN_EMAILS env var`)
  return { 
    success: false, 
    message: `Contact system admin to remove ${email} as admin. Update NEXT_PUBLIC_ADMIN_EMAILS environment variable.` 
  }
}
