import { type NextRequest, NextResponse } from "next/server"
import { adminAuth } from "./firebase-admin"

export async function verifyFirebaseToken(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return { error: "No token provided", status: 401 }
    }

    const decodedToken = await adminAuth.verifyIdToken(token)
    return { user: decodedToken, status: 200 }
  } catch (error) {
    console.error("Token verification failed:", error)
    return { error: "Invalid token", status: 401 }
  }
}

export async function requireAuth(request: NextRequest) {
  const result = await verifyFirebaseToken(request)

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return result.user
}

export async function requireAdmin(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    if (user instanceof NextResponse) {
      return user // Return the error response
    }

    if (!user || !user.email) {
      console.error("[v0] User or user email is undefined")
      return NextResponse.json({ error: "Invalid user data" }, { status: 401 })
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
    console.log(`[v0] Admin check - User email: ${user.email}, Admin email: ${adminEmail}`)

    if (!adminEmail) {
      console.error("[v0] No admin email configured in environment variables")
      return NextResponse.json({ error: "Admin configuration missing" }, { status: 500 })
    }

    if (user.email !== adminEmail) {
      console.log(`[v0] Admin access denied for ${user.email}, expected ${adminEmail}`)
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log(`[v0] Admin access granted for ${user.email}`)
    return user
  } catch (error) {
    console.error("[v0] Admin authentication error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }
}
