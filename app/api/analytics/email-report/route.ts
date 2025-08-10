import { type NextRequest, NextResponse } from "next/server"
import { getAnalyticsData, getTrendingProducts } from "@/lib/analytics"
import { sendEmail } from "@/lib/email"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { report_type = "monthly_trending", recipient_email } = body

    if (!recipient_email) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 })
    }

    // Get analytics data
    const analyticsData = await getAnalyticsData("monthly")
    const trendingProducts = await getTrendingProducts("monthly", 10)

    // Generate email content
    const emailContent = generateTrendingReportEmail(analyticsData, trendingProducts)

    // Send email
    const emailSent = await sendEmail({
      to: recipient_email,
      subject: `Monthly Trending Products Report - ${new Date().toLocaleDateString()}`,
      html: emailContent,
    })

    if (emailSent) {
      // Log the email report
      await sql`
        INSERT INTO email_reports (
          report_type, report_period, period_start, period_end,
          recipient_email, status, report_data
        )
        VALUES (
          ${report_type}, 'monthly', 
          ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]},
          ${new Date().toISOString().split("T")[0]},
          ${recipient_email}, 'sent',
          ${JSON.stringify({ analytics: analyticsData, trending: trendingProducts })}
        )
      `

      return NextResponse.json({ success: true, message: "Report sent successfully" })
    } else {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error sending analytics email report:", error)
    return NextResponse.json({ error: "Failed to send report" }, { status: 500 })
  }
}

function generateTrendingReportEmail(analyticsData: any, trendingProducts: any[]): string {
  const topProductsHtml = trendingProducts
    .slice(0, 5)
    .map(
      (product, index) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; font-weight: bold; color: #d97706;">#${index + 1}</td>
      <td style="padding: 12px;">
        <div style="font-weight: 600; color: #374151;">${product.name}</div>
        <div style="font-size: 14px; color: #6b7280; text-transform: capitalize;">${product.category}</div>
      </td>
      <td style="padding: 12px; text-align: center; color: #059669; font-weight: 600;">
        ${product.total_views.toLocaleString()}
      </td>
      <td style="padding: 12px; text-align: center; color: #0891b2; font-weight: 600;">
        ${product.unique_views.toLocaleString()}
      </td>
      <td style="padding: 12px; text-align: center; color: #dc2626; font-weight: 600;">
        ${product.total_orders.toLocaleString()}
      </td>
      <td style="padding: 12px; text-align: center; color: #7c3aed; font-weight: 600;">
        ₹${product.revenue.toLocaleString("en-IN")}
      </td>
    </tr>
  `,
    )
    .join("")

  const categoryStatsHtml = analyticsData.categories_performance
    .slice(0, 3)
    .map(
      (category) => `
    <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
      <h4 style="margin: 0 0 8px 0; color: #d97706; text-transform: capitalize;">${category.category}</h4>
      <div style="display: flex; justify-content: space-between; font-size: 14px; color: #374151;">
        <span>Views: <strong>${category.views.toLocaleString()}</strong></span>
        <span>Orders: <strong>${category.orders.toLocaleString()}</strong></span>
        <span>Revenue: <strong>₹${category.revenue.toLocaleString("en-IN")}</strong></span>
      </div>
    </div>
  `,
    )
    .join("")

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #d97706 0%, #eab308 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Monthly Trending Products Report</h1>
        <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">
          ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()} - ${new Date().toLocaleDateString()}
        </p>
      </div>

      <!-- Summary Stats -->
      <div style="padding: 30px; background: #fff;">
        <h2 style="color: #d97706; margin-bottom: 20px;">📊 Monthly Overview</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #0891b2;">${analyticsData.total_views.toLocaleString()}</div>
            <div style="color: #374151; font-weight: 600;">Total Views</div>
          </div>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #059669;">${analyticsData.unique_views.toLocaleString()}</div>
            <div style="color: #374151; font-weight: 600;">Unique Visitors</div>
          </div>
        </div>

        <!-- Top Products Table -->
        <h3 style="color: #d97706; margin-bottom: 15px;">🏆 Top 5 Trending Products</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #e5e7eb;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600;">Rank</th>
              <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600;">Product</th>
              <th style="padding: 12px; text-align: center; color: #374151; font-weight: 600;">Views</th>
              <th style="padding: 12px; text-align: center; color: #374151; font-weight: 600;">Unique</th>
              <th style="padding: 12px; text-align: center; color: #374151; font-weight: 600;">Orders</th>
              <th style="padding: 12px; text-align: center; color: #374151; font-weight: 600;">Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${topProductsHtml}
          </tbody>
        </table>

        <!-- Category Performance -->
        <h3 style="color: #d97706; margin-bottom: 15px;">📈 Category Performance</h3>
        ${categoryStatsHtml}

        <!-- Action Items -->
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-top: 30px;">
          <h4 style="color: #92400e; margin: 0 0 10px 0;">💡 Insights & Recommendations</h4>
          <ul style="color: #374151; margin: 0; padding-left: 20px;">
            <li>Focus marketing efforts on the top trending products</li>
            <li>Consider increasing inventory for high-performing items</li>
            <li>Analyze low-performing categories for improvement opportunities</li>
            <li>Use trending data to inform upcoming product launches</li>
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>Golden Threads Heritage Boutique | Analytics Dashboard</p>
        <p>This report was automatically generated on ${new Date().toLocaleString()}</p>
      </div>
    </div>
  `
}
