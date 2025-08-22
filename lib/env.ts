/**
 * Simplified Environment Variables for Firebase Auth
 * Removes unnecessary JWT/NextAuth secrets when using Firebase
 */

// Database
export const DATABASE_URL = process.env.DATABASE_URL!

// Application
export const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!
export const NODE_ENV = process.env.NODE_ENV || "development"
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL!

// Firebase Client (Public)
export const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

// Firebase Admin (Server-side only)
export const FIREBASE_ADMIN_CONFIG = {
  projectId: process.env.FIREBASE_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")!,
}

// Razorpay Configuration
export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!
export const NEXT_PUBLIC_RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!

// Email Service
export const RESEND_API_KEY = process.env.RESEND_API_KEY
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
export const FROM_EMAIL = process.env.FROM_EMAIL!
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL!

// Optional: Only if you need additional encryption for sensitive data
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY // Optional

// Development
export const DEBUG_MODE = process.env.DEBUG_MODE === "true"
export const isDevelopment = NODE_ENV === "development"
export const RATE_LIMIT_MAX = Number.parseInt(process.env.RATE_LIMIT_MAX || "100")
export const RATE_LIMIT_WINDOW = Number.parseInt(process.env.RATE_LIMIT_WINDOW || "900000")

// Validation function - simplified for Firebase auth
export function validateEnvironment() {
  const requiredVars = [
    "DATABASE_URL",
    "NEXT_PUBLIC_BASE_URL",
    "ADMIN_EMAIL",
    // Firebase Client Config
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    // Firebase Admin Config
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    // Razorpay Config
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    // Email
    "FROM_EMAIL",
    "SUPPORT_EMAIL",
  ]

  const missing = requiredVars.filter((varName) => !process.env[varName])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }

  // Validate email service
  if (!RESEND_API_KEY && !SENDGRID_API_KEY) {
    throw new Error("Either RESEND_API_KEY or SENDGRID_API_KEY must be provided")
  }

  console.log("✅ Environment variables validated successfully (Firebase Auth + Razorpay)")
}
