import { Resend } from "resend"
import sgMail from "@sendgrid/mail"
import { RESEND_API_KEY, SENDGRID_API_KEY, FROM_EMAIL } from "./env"

// Initialize email services
let resend: Resend | null = null
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY)
}

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const emailData = {
      from: options.from || FROM_EMAIL,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    }

    // Try Resend first
    if (resend) {
      await resend.emails.send({
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      })
      return true
    }

    // Fallback to SendGrid
    if (SENDGRID_API_KEY) {
      await sgMail.sendMultiple({
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      })
      return true
    }

    throw new Error("No email service configured")
  } catch (error) {
    console.error("Email sending failed:", error)
    return false
  }
}

// Email templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: "Welcome to Golden Threads - Your Heritage Fashion Journey Begins",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #d97706 0%, #eab308 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Golden Threads</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">35+ Years of Heritage Fashion</p>
        </div>
        <div style="padding: 30px; background: #fff;">
          <h2 style="color: #d97706; margin-bottom: 20px;">Hello ${name}!</h2>
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Thank you for joining the Golden Threads family. We're excited to share our heritage collection 
            of premium women's and children's fashion with you.
          </p>
          <p style="color: #374151; line-height: 1.6; margin-bottom: 30px;">
            With over 35 years of expertise in curating the finest fabrics and designs, we're here to help 
            you discover timeless elegance for you and your family.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}" 
               style="background: linear-gradient(135deg, #d97706 0%, #eab308 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Start Shopping
            </a>
          </div>
        </div>
        <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p>Golden Threads Heritage Boutique | 123 Fashion Street, Mumbai | +91 98765 43210</p>
        </div>
      </div>
    `,
  }),

  orderConfirmation: (orderNumber: string, customerName: string, total: number) => ({
    subject: `Order Confirmed #${orderNumber} - Golden Threads`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #d97706 0%, #eab308 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Thank you for your purchase</p>
        </div>
        <div style="padding: 30px; background: #fff;">
          <h2 style="color: #d97706; margin-bottom: 20px;">Hello ${customerName}!</h2>
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Your order has been confirmed and is being prepared with the same care we've provided for over 35 years.
          </p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #d97706; margin: 0 0 10px 0;">Order Details</h3>
            <p style="margin: 5px 0; color: #374151;"><strong>Order Number:</strong> #${orderNumber}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Total Amount:</strong> ₹${total.toLocaleString("en-IN")}</p>
          </div>
          <p style="color: #374151; line-height: 1.6;">
            We'll send you another email with tracking information once your order ships.
          </p>
        </div>
      </div>
    `,
  }),

  contactForm: (name: string, email: string, message: string) => ({
    subject: `New Contact Form Submission - ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d97706;">New Contact Form Submission</h2>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p style="background: white; padding: 15px; border-radius: 4px;">${message}</p>
        </div>
      </div>
    `,
  }),
}
