import { NextResponse } from "next/server"

export async function GET() {
  // Only return the server-side key id; never read NEXT_PUBLIC_* here
  const keyId = process.env.RAZORPAY_KEY_ID || ""
  const enabled = Boolean(keyId)

  return NextResponse.json({
    enabled,
    keyId: enabled ? keyId : null,
  })
}
