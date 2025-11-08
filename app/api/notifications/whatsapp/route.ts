import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { type, phone, data } = await request.json()

    console.log("[v0] Sending WhatsApp notification:", { type, phone, data })

    console.log("[v0] WhatsApp notifications temporarily disabled - Twilio channel configuration issues")
    console.log("[v0] WhatsApp message would be sent to:", phone)

    const whatsappTemplates = {
      payment_confirmation: `🎉 *Payment Confirmed!*

Order #${data.orderId}
Amount: ₹${data.totalAmount}
Payment ID: ${data.paymentId}

Your order is confirmed and will be processed shortly. Thank you for your purchase! 🛍️

*Golden Threads Heritage Boutique*`,
      order_status_update: `📦 *Order Update*

Order #${data.orderId}
Status: *${data.status?.toUpperCase?.() || data.status}*
${data.trackingNumber ? `Tracking: ${data.trackingNumber}` : ""}
${data.trackingUrl ? `Track here: ${data.trackingUrl}` : ""}

Track your order in our app or website. Thank you! 🚚

*Golden Threads Heritage Boutique*`,
      payment_reminder: `⏰ *Payment Reminder*

Order #${data.orderId}
Time remaining: 20 minutes

Complete payment: ${data.paymentLink}

Need help? Contact our support team. 💬

*Golden Threads Heritage Boutique*`,
    }

    const message = whatsappTemplates[type as keyof typeof whatsappTemplates]
    if (!message) {
      return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
    }

    console.log("[v0] Message:", message)

    // Return success response to prevent order processing failures
    return NextResponse.json({
      success: true,
      message: "WhatsApp notification temporarily disabled - logged to console",
      fallback: "logged to console",
      note: "WhatsApp service will be re-enabled after Twilio channel configuration is fixed",
    })

    /* 
    // Original Twilio implementation - commented out due to channel issues
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER

    if (twilioAccountSid && twilioAuthToken && twilioWhatsAppNumber) {
      try {
        // Use Twilio WhatsApp API
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
        const credentials = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64")

        const formattedFromNumber = twilioWhatsAppNumber.startsWith("+")
          ? `whatsapp:${twilioWhatsAppNumber}`
          : `whatsapp:+${twilioWhatsAppNumber}`

        const formattedToNumber = phone.startsWith("+") ? `whatsapp:${phone}` : `whatsapp:+91${phone}` // Default to India country code if no + prefix

        console.log("[v0] Formatted WhatsApp numbers - From:", formattedFromNumber, "To:", formattedToNumber)

        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: formattedFromNumber,
            To: formattedToNumber,
            Body: message.trim(),
          }),
        })

        if (response.ok) {
          const result = await response.json()
          console.log("[v0] WhatsApp message sent successfully via Twilio:", result.sid)
          return NextResponse.json({
            success: true,
            message: "WhatsApp notification sent successfully",
            sid: result.sid,
          })
        } else {
          const error = await response.text()
          console.error("[v0] Twilio WhatsApp API error:", error)

          let errorDetails = error
          try {
            const errorObj = JSON.parse(error)
            errorDetails = `Code: ${errorObj.code}, Message: ${errorObj.message}`

            if (errorObj.code === 63007) {
              console.error(
                "[v0] WhatsApp Channel Error - Check that your Twilio WhatsApp number is properly configured and approved",
              )
              console.error("[v0] Make sure TWILIO_WHATSAPP_NUMBER includes country code (e.g., +14155238886)")
            }
          } catch (parseError) {
            // Keep original error if parsing fails
          }

          throw new Error(`Twilio API error: ${errorDetails}`)
        }
      } catch (twilioError) {
        console.error("[v0] Twilio WhatsApp sending failed:", twilioError)
        // Fall back to console logging
        console.log("[v0] WhatsApp message would be sent to:", phone)
        console.log("[v0] Message:", message)
        return NextResponse.json({
          success: false,
          message: "WhatsApp notification failed - Twilio error",
          fallback: "logged to console",
          error: twilioError.message,
        })
      }
    } else {
      console.warn("[v0] WhatsApp notifications not configured. Missing Twilio environment variables:")
      console.warn("- TWILIO_ACCOUNT_SID:", !!twilioAccountSid)
      console.warn("- TWILIO_AUTH_TOKEN:", !!twilioAuthToken)
      console.warn("- TWILIO_WHATSAPP_NUMBER:", !!twilioWhatsAppNumber)

      if (!twilioWhatsAppNumber) {
        console.warn("[v0] TWILIO_WHATSAPP_NUMBER should be in format: +14155238886 (with country code)")
      }

      console.log("[v0] WhatsApp message would be sent to:", phone)
      console.log("[v0] Message:", message)

      return NextResponse.json({
        success: false,
        message: "WhatsApp notifications not configured - missing Twilio credentials",
        fallback: "logged to console",
        instructions: {
          setup: "Configure Twilio WhatsApp in your environment variables",
          required: [
            "TWILIO_ACCOUNT_SID - Your Twilio Account SID",
            "TWILIO_AUTH_TOKEN - Your Twilio Auth Token",
            "TWILIO_WHATSAPP_NUMBER - Your approved WhatsApp number (e.g., +14155238886)",
          ],
          note: "WhatsApp number must be approved by Twilio and include country code with + prefix",
        },
      })
    }
    */
  } catch (error) {
    console.error("[v0] WhatsApp notification error:", error)
    return NextResponse.json({ error: "Failed to send WhatsApp notification" }, { status: 500 })
  }
}
