import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    // Mock email service - replace with actual email service like SendGrid, Resend, etc.
    console.log("[v0] Sending email notification:", { type, data })

    const emailTemplates = {
      payment_confirmation: {
        subject: `Payment Confirmed - Order #${data.orderId}`,
        body: `
          Dear Customer,
          
          Your payment of ₹${data.totalAmount} has been successfully confirmed for Order #${data.orderId}.
          
          Payment ID: ${data.paymentId}
          Order Status: Confirmed
          
          We will process your order shortly and send you tracking information once shipped.
          
          Thank you for your purchase!
        `,
      },
      order_status_update: {
        subject: `Order Update - Order #${data.orderId}`,
        body: `
          Dear Customer,
          
          Your order #${data.orderId} status has been updated to: ${data.status.toUpperCase()}
          
          ${data.trackingNumber ? `Tracking Number: ${data.trackingNumber}` : ""}
          
          You can track your order status in your account dashboard.
          
          Thank you for your business!
        `,
      },
      payment_reminder: {
        subject: `Payment Reminder - Order #${data.orderId}`,
        body: `
          Dear Customer,
          
          Your order #${data.orderId} is pending payment.
          
          Please complete your payment within 20 minutes to confirm your order.
          
          Payment Link: ${data.paymentLink}
          
          If you're experiencing issues, please contact our support team.
        `,
      },
    }

    const template = emailTemplates[type as keyof typeof emailTemplates]

    if (!template) {
      return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
    }

    // Here you would integrate with your actual email service
    // For now, we'll just log the email content
    console.log("[v0] Email would be sent to:", data.userEmail || data.email)
    console.log("[v0] Subject:", template.subject)
    console.log("[v0] Body:", template.body)

    return NextResponse.json({
      success: true,
      message: "Email notification sent successfully",
    })
  } catch (error) {
    console.error("[v0] Email notification error:", error)
    return NextResponse.json({ error: "Failed to send email notification" }, { status: 500 })
  }
}
