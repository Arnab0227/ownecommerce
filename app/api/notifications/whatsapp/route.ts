import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { type, phone, data } = await request.json()

    // Mock WhatsApp service - replace with actual WhatsApp Business API
    console.log("[v0] Sending WhatsApp notification:", { type, phone, data })

    const whatsappTemplates = {
      payment_confirmation: `
🎉 Payment Confirmed!

Order #${data.orderId}
Amount: ₹${data.totalAmount}
Payment ID: ${data.paymentId}

Your order is confirmed and will be processed shortly. Thank you for your purchase! 🛍️
      `,
      order_status_update: `
📦 Order Update

Order #${data.orderId}
Status: ${data.status.toUpperCase()}
${data.trackingNumber ? `Tracking: ${data.trackingNumber}` : ""}

Track your order in our app or website. Thank you! 🚚
      `,
      payment_reminder: `
⏰ Payment Reminder

Order #${data.orderId}
Time remaining: 20 minutes

Complete payment: ${data.paymentLink}

Need help? Contact our support team. 💬
      `,
    }

    const message = whatsappTemplates[type as keyof typeof whatsappTemplates]

    if (!message) {
      return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
    }

    // Here you would integrate with WhatsApp Business API
    // For now, we'll just log the message content
    console.log("[v0] WhatsApp message would be sent to:", phone)
    console.log("[v0] Message:", message)

    return NextResponse.json({
      success: true,
      message: "WhatsApp notification sent successfully",
    })
  } catch (error) {
    console.error("[v0] WhatsApp notification error:", error)
    return NextResponse.json({ error: "Failed to send WhatsApp notification" }, { status: 500 })
  }
}
