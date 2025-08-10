import { type NextRequest, NextResponse } from "next/server"
import { trackProductView } from "@/lib/analytics"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, view_duration } = body

    if (!product_id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Get request metadata
    const authorization = request.headers.get("authorization")
    const ip_address = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
    const user_agent = request.headers.get("user-agent")
    const referrer = request.headers.get("referer")

    const success = await trackProductView({
      product_id: Number(product_id),
      authorization: authorization || undefined,
      ip_address: ip_address || undefined,
      user_agent: user_agent || undefined,
      referrer: referrer || undefined,
      view_duration: view_duration || 0,
    })

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to track view" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in track-view API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
