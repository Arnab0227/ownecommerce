// WhatsApp notification utility using Twilio
export interface WhatsAppMessage {
  to: string
  message: string
}

export async function sendWhatsAppMessage({ to, message }: WhatsAppMessage): Promise<boolean> {
  try {
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER

    if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
      console.warn("WhatsApp notifications not configured - missing Twilio credentials")
      return false
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
    const credentials = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64")

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: `whatsapp:${twilioWhatsAppNumber}`,
        To: `whatsapp:${to}`,
        Body: message,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log("WhatsApp message sent successfully:", result.sid)
      return true
    } else {
      const error = await response.text()
      console.error("Twilio WhatsApp API error:", error)
      return false
    }
  } catch (error) {
    console.error("WhatsApp sending failed:", error)
    return false
  }
}

// WhatsApp message templates
export const whatsappTemplates = {
  orderConfirmation: (orderNumber: string, total: number) => `
🎉 *Order Confirmed!*

Order #${orderNumber}
Total: ₹${total.toLocaleString("en-IN")}

Your order has been confirmed and is being prepared with care.

*Golden Threads Heritage Boutique*
35+ Years of Heritage Fashion
  `,

  orderShipped: (orderNumber: string, trackingNumber: string, trackingUrl?: string) => `
📦 *Order Shipped!*

Order #${orderNumber}
Tracking: ${trackingNumber}
${trackingUrl ? `Track: ${trackingUrl}` : ""}

Your order is on its way! 🚚

*Golden Threads Heritage Boutique*
  `,

  orderDelivered: (orderNumber: string) => `
✅ *Order Delivered!*

Order #${orderNumber}

Thank you for choosing Golden Threads! We hope you love your purchase. 

Please share your feedback with us! ⭐

*Golden Threads Heritage Boutique*
  `,
}
