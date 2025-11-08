import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { neon } from "@neondatabase/serverless";

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  user_id?: string;
}

export async function POST(request: Request) {
  try {
    const body: ContactFormData = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, email, subject, and message are required",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || "",
      subject: body.subject?.trim() || "Contact Form Submission",
      message: body.message.trim(),
      user_id: body.user_id || null,
    };

    try {
      if (!process.env.DATABASE_URL) {
        console.log("No DATABASE_URL found, returning empty array");
        return NextResponse.json([]);
      }

      const sql = neon(process.env.DATABASE_URL);
      await sql`
        INSERT INTO contact_queries (
          user_id, name, email, phone, subject, message, created_at, status
        ) VALUES (
          ${sanitizedData.user_id},
          ${sanitizedData.name},
          ${sanitizedData.email},
          ${sanitizedData.phone},
          ${sanitizedData.subject},
          ${sanitizedData.message},
          NOW(),
          'new'
        )
      `;
      console.log("[v0] Contact query stored in database");
    } catch (dbError) {
      console.error("[v0] Failed to store contact query in database:", dbError);
      // Continue with email sending even if database storage fails
    }

    // Enhanced admin email with all form data
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #d97706 0%, #eab308 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Suktara Website</p>
        </div>
        <div style="padding: 30px; background: #fff;">
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #d97706; margin: 0 0 15px 0;">Contact Details</h3>
            <p style="margin: 8px 0; color: #374151;"><strong>Name:</strong> ${
              sanitizedData.name
            }</p>
            <p style="margin: 8px 0; color: #374151;"><strong>Email:</strong> ${
              sanitizedData.email
            }</p>
            ${
              sanitizedData.phone
                ? `<p style="margin: 8px 0; color: #374151;"><strong>Phone:</strong> ${sanitizedData.phone}</p>`
                : ""
            }
            <p style="margin: 8px 0; color: #374151;"><strong>Subject:</strong> ${
              sanitizedData.subject
            }</p>
          </div>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
            <h3 style="color: #d97706; margin: 0 0 15px 0;">Message</h3>
            <div style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #d97706;">
              <p style="margin: 0; color: #374151; line-height: 1.6; white-space: pre-wrap;">${
                sanitizedData.message
              }</p>
            </div>
          </div>
          <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Action Required:</strong> Please respond to this customer inquiry within 24 hours.
            </p>
          </div>
        </div>
        <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p>Suktara Heritage Boutique | Fashion Street, Mumbai | +91 98765 43210</p>
          <p>Submitted on: ${new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          })}</p>
        </div>
      </div>
    `;

    // Auto-reply email for customer
    const customerReplyHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #d97706 0%, #eab308 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Contacting Us</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Suktara Heritage Boutique</p>
        </div>
        <div style="padding: 30px; background: #fff;">
          <h2 style="color: #d97706; margin-bottom: 20px;">Hello ${
            sanitizedData.name
          }!</h2>
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Thank you for reaching out to us. We have received your message and our team will get back to you within 24 hours.
          </p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #d97706; margin: 0 0 10px 0;">Your Message Summary</h3>
            <p style="margin: 5px 0; color: #374151;"><strong>Subject:</strong> ${
              sanitizedData.subject
            }</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Submitted:</strong> ${new Date().toLocaleString(
              "en-IN",
              { timeZone: "Asia/Kolkata" }
            )}</p>
          </div>
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            In the meantime, feel free to browse our heritage collection or visit our store at Fashion Street, Mumbai.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.NEXT_PUBLIC_BASE_URL || "https://suktara.com"
            }" 
               style="background: linear-gradient(135deg, #d97706 0%, #eab308 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Continue Shopping
            </a>
          </div>
        </div>
        <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p>Suktara Heritage Boutique | Fashion Street, Mumbai | +91 98765 43210</p>
          <p>Email: info@suktara.com | 35+ Years of Heritage Fashion</p>
        </div>
      </div>
    `;

    // Send admin notification email
    const adminEmail = process.env.ADMIN_EMAIL || "info@suktara.com";
    const adminEmailSent = await sendEmail({
      to: adminEmail,
      subject: `New Contact Form: ${sanitizedData.subject} - ${sanitizedData.name}`,
      html: adminEmailHtml,
    });

    // Send auto-reply to customer
    const customerEmailSent = await sendEmail({
      to: sanitizedData.email,
      subject: "Thank you for contacting Suktara - We'll be in touch soon",
      html: customerReplyHtml,
    });

    console.log("[v0] Contact form submission processed:", {
      adminEmailSent,
      customerEmailSent,
      name: sanitizedData.name,
      email: sanitizedData.email,
      subject: sanitizedData.subject,
    });

    return NextResponse.json({
      success: true,
      message: "Contact form submitted successfully",
      emailsSent: {
        admin: adminEmailSent,
        customer: customerEmailSent,
      },
    });
  } catch (error) {
    console.error("Contact form submission error:", error);
    return NextResponse.json(
      {
        error: "Failed to process contact form submission",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
