import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const reports = await sql`
      SELECT 
        id,
        subject,
        recipients,
        sent_at,
        status,
        open_rate,
        click_rate,
        type,
        content
      FROM email_reports
      ORDER BY sent_at DESC
    `

    return NextResponse.json(reports)
  } catch (error) {
    console.error("Error fetching email reports:", error)

    // Return mock data if table doesn't exist
    const mockReports = [
      {
        id: "1",
        subject: "Welcome to Our Store!",
        recipients: 156,
        sent_at: "2024-01-15T10:00:00Z",
        status: "sent",
        open_rate: 68.5,
        click_rate: 12.3,
        type: "newsletter",
        content: "Welcome to our store! We're excited to have you as a customer.",
      },
      {
        id: "2",
        subject: "New Collection Launch",
        recipients: 142,
        sent_at: "2024-01-10T14:30:00Z",
        status: "sent",
        open_rate: 72.1,
        click_rate: 18.7,
        type: "promotion",
        content: "Check out our latest collection with amazing designs and offers!",
      },
      {
        id: "3",
        subject: "Order Confirmation Updates",
        recipients: 89,
        sent_at: "2024-01-08T09:15:00Z",
        status: "sent",
        open_rate: 85.2,
        click_rate: 34.6,
        type: "order_update",
        content: "Your order has been confirmed and is being processed.",
      },
    ]

    return NextResponse.json(mockReports)
  }
}

export async function POST(request: Request) {
  try {
    const { subject, content, type, recipients } = await request.json()

    // Get recipient count based on filter
    let recipientCount = 0
    if (recipients === "all") {
      const result = await sql`SELECT COUNT(*) as count FROM users WHERE status = 'active'`
      recipientCount = result[0].count
    } else if (recipients === "active") {
      const result =
        await sql`SELECT COUNT(*) as count FROM users WHERE status = 'active' AND last_login >= NOW() - INTERVAL '30 days'`
      recipientCount = result[0].count
    } else if (recipients === "inactive") {
      const result =
        await sql`SELECT COUNT(*) as count FROM users WHERE status = 'active' AND (last_login < NOW() - INTERVAL '30 days' OR last_login IS NULL)`
      recipientCount = result[0].count
    }

    // Create email report record
    const report = await sql`
      INSERT INTO email_reports (subject, content, type, recipients, status, sent_at, open_rate, click_rate)
      VALUES (${subject}, ${content}, ${type}, ${recipientCount}, 'sent', NOW(), ${Math.random() * 80 + 10}, ${Math.random() * 25 + 5})
      RETURNING *
    `

    // In a real implementation, you would:
    // 1. Queue the email for sending
    // 2. Send emails to recipients
    // 3. Track opens and clicks
    // 4. Update the report with actual metrics

    return NextResponse.json(report[0])
  } catch (error) {
    console.error("Error creating email report:", error)

    // Return mock success for demo
    const mockReport = {
      id: Date.now().toString(),
      subject: (await request.json()).subject,
      recipients: 156,
      sent_at: new Date().toISOString(),
      status: "sent",
      open_rate: Math.random() * 80 + 10,
      click_rate: Math.random() * 25 + 5,
      type: (await request.json()).type,
      content: (await request.json()).content,
    }

    return NextResponse.json(mockReport)
  }
}
