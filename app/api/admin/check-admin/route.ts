import { NextResponse } from "next/server"
import { isUserAdmin } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const admin = isUserAdmin(email)

    return NextResponse.json({ isAdmin: admin })
  } catch (error) {
    console.error("[v0] Error checking admin status:", error)
    return NextResponse.json({ error: "Failed to check admin status" }, { status: 500 })
  }
}
