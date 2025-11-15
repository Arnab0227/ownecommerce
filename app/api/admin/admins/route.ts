import { NextResponse, type NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth-middleware"
import { getAllAdmins, makeUserAdmin, removeAdminRole } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  const adminUser = await requireAdmin(request)

  if (adminUser instanceof NextResponse) {
    return adminUser
  }

  const admins = await getAllAdmins()
  return NextResponse.json(admins)
}

export async function POST(request: NextRequest) {
  const adminUser = await requireAdmin(request)

  if (adminUser instanceof NextResponse) {
    return adminUser
  }

  try {
    const { email, action } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (action === "promote") {
      const result = await makeUserAdmin(email)
      if (result.success) {
        return NextResponse.json({ success: true, message: result.message })
      } else {
        return NextResponse.json({ error: result.message }, { status: 400 })
      }
    } else if (action === "demote") {
      const result = await removeAdminRole(email)
      if (result.success) {
        return NextResponse.json({ success: true, message: result.message })
      } else {
        return NextResponse.json({ error: result.message }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Error managing admins:", error)
    return NextResponse.json({ error: "Failed to manage admins" }, { status: 500 })
  }
}
