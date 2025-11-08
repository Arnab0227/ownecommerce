import { NextResponse } from "next/server"
import { Resend } from "resend"
import fs from "fs"
import path from "path"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { type, data } = await request.json()

    let subject = ""
    let html = ""
    const attachments: any[] = []

    // Add status-based image attachments
    const getStatusImage = (status: string) => {
      let imagePath = ""
      let contentId = ""

      if (status === "pending" || status === "confirmed") {
        imagePath = path.join(process.cwd(), "public", "waiting.png")
        contentId = "waiting-image"
      } else if (status === "shipped" || status === "delivered") {
        imagePath = path.join(process.cwd(), "public", "order.png")
        contentId = "order-image"
      } else if (status === "cancelled") {
        imagePath = path.join(process.cwd(), "public", "failed.png")
        contentId = "failed-image"
      }

      if (imagePath && fs.existsSync(imagePath)) {
        const attachment = fs.readFileSync(imagePath).toString("base64")
        return {
          content: attachment,
          filename: path.basename(imagePath),
          content_id: contentId,
        }
      }
      return null
    }

    switch (type) {
      case "order_confirmation":
        subject = "Order Confirmation - Golden Threads"
        const statusImage = getStatusImage(data.status)
        if (statusImage) {
          attachments.push(statusImage)
        }

        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ea580c;">Order has been placed successfully!</h2>
            ${statusImage ? `<img src="cid:${statusImage.content_id}" alt="Order Status" style="max-width: 200px; margin: 20px 0;" />` : ""}
            <p>Thank you for your order! Your order has been confirmed and we're processing it now.</p>
            <p>Hold tight while we process and deliver to your doorstep. It will not take long!</p>
            <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3>Order Details:</h3>
              <p><strong>Total Amount:</strong> ₹${data.totalAmount?.toLocaleString("en-IN") || "N/A"}</p>
              <p><strong>Status:</strong> ${data.status || "Pending"}</p>
            </div>
            <p>We'll send you updates as your order progresses.</p>
            <p>Best regards,<br>Golden Threads Team</p>
          </div>
        `
        break

      case "status_update":
        subject = `Order Status Update - Golden Threads`
        const updateStatusImage = getStatusImage(data.status)
        if (updateStatusImage) {
          attachments.push(updateStatusImage)
        }

        let statusMessage = ""
        let reviewSection = ""

        if (data.status === "confirmed") {
          statusMessage = "Your order has been confirmed and is being prepared."
        } else if (data.status === "shipped") {
          statusMessage = "Great news! Your order has been shipped and is on its way to you."
        } else if (data.status === "delivered") {
          statusMessage = "Your order has been delivered successfully. We hope you love your purchase!"
          reviewSection = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; margin: 30px 0; border-radius: 12px; text-align: center;">
              <h3 style="color: white; margin: 0 0 15px 0; font-size: 24px;">Share Your Experience</h3>
              <p style="color: #f0f0f0; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                Your feedback helps us improve and helps other customers make informed decisions. 
                We'd love to hear about your experience with this product!
              </p>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com"}/my-reviews" 
                 style="display: inline-block; background: white; color: #667eea; padding: 14px 32px; 
                        text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.3s;">
                Write a Review
              </a>
              <p style="color: #f0f0f0; margin: 20px 0 0 0; font-size: 14px;">
                ⭐ Share photos and earn loyalty points!
              </p>
            </div>
          `
        } else if (data.status === "cancelled") {
          statusMessage = "Your order has been cancelled. If you have any questions, please contact our support team."
        }

        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ea580c;">Order Status Update</h2>
            ${updateStatusImage ? `<img src="cid:${updateStatusImage.content_id}" alt="Order Status" style="max-width: 200px; margin: 20px 0;" />` : ""}
            <p>${statusMessage}</p>
            ${
              data.trackingNumber
                ? `
              <div style="background: #f0f9ff; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #0ea5e9;">
                <h3 style="margin: 0 0 10px 0; color: #0369a1;">Tracking Information</h3>
                <p style="margin: 0;"><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #64748b;">You can track your package using this number.</p>
              </div>
            `
                : ""
            }
            ${reviewSection}
            <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3>Order Details:</h3>
              <p><strong>Total Amount:</strong> ₹${data.totalAmount?.toLocaleString("en-IN") || "N/A"}</p>
              <p><strong>Current Status:</strong> ${data.status || "Unknown"}</p>
            </div>
            <p>Thank you for choosing Golden Threads!</p>
            <p>Best regards,<br>Golden Threads Team</p>
          </div>
        `
        break

      default:
        return NextResponse.json({ error: "Invalid email type" }, { status: 400 })
    }

    const emailData = {
      from: process.env.FROM_EMAIL || "Golden Threads <orders@goldenthreads.com>",
      to: [data.userEmail],
      subject,
      html,
      attachments,
    }

    const result = await resend.emails.send(emailData)
    console.log("[v0] Email sent successfully:", result)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("[v0] Email sending error:", error)
    return NextResponse.json(
      { error: "Failed to send email", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
