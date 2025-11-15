/**
 * Simplified Environment Variables for Firebase Auth + Environment-based Admin
 */

// Database (Optional)
export const DATABASE_URL = process.env.DATABASE_URL

// Application
export const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!
export const NODE_ENV = process.env.NODE_ENV || "development"

export const ADMIN_EMAILS = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || ""
export const NEXT_PUBLIC_ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS || ""

export const KV_REST_API_URL = process.env.KV_REST_API_URL
export const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN

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

// Email Service
export const RESEND_API_KEY = process.env.RESEND_API_KEY
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
export const FROM_EMAIL = process.env.FROM_EMAIL!
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL!

export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
export const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER

// Optional: Only if you need additional encryption for sensitive data
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

// Development
export const DEBUG_MODE = process.env.DEBUG_MODE === "true"
export const isDevelopment = NODE_ENV === "development"
export const RATE_LIMIT_MAX = Number.parseInt(process.env.RATE_LIMIT_MAX || "100")
export const RATE_LIMIT_WINDOW = Number.parseInt(process.env.RATE_LIMIT_WINDOW || "900000")

export function validateEnvironment() {
  const requiredVars = [
    "NEXT_PUBLIC_BASE_URL",
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
    // Email
    "FROM_EMAIL",
    "SUPPORT_EMAIL",
    // Resend
    "RESEND_API_KEY",
    // WhatsApp
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_WHATSAPP_NUMBER",
    // Admin emails
    "NEXT_PUBLIC_ADMIN_EMAILS",
  ]

  const missing = requiredVars.filter((varName) => !process.env[varName])

  if (missing.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missing.join(", ")}`)
  }

  console.log("✅ Environment variables validated (Firebase Auth + Admin via Env)")
}
