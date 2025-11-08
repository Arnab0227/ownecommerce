import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function ensureTablesExist() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS store_settings (
        id SERIAL PRIMARY KEY,
        /* Updated default store name from Golden Threads to Suktara */
        store_name VARCHAR(255) DEFAULT 'Suktara',
        store_description TEXT DEFAULT 'Premium fashion for women and kids',
        /* Updated default email from goldenthreads.com to suktara.com */
        store_email VARCHAR(255) DEFAULT 'info@suktara.com',
        store_phone VARCHAR(20) DEFAULT '+91-9876543210',
        store_address TEXT DEFAULT 'Fashion Street, Mumbai, India',
        currency VARCHAR(10) DEFAULT 'INR',
        timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
        tax_rate DECIMAL DEFAULT 0, -- no tax
        shipping_fee DECIMAL DEFAULT 50,
        free_shipping_threshold DECIMAL DEFAULT 999,
        privacy_policy_url TEXT DEFAULT '',
        terms_of_service_url TEXT DEFAULT '',
        data_deletion_url TEXT DEFAULT '',
        shipping_policy_url TEXT DEFAULT '',
        cancellation_refund_url TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS payment_settings (
        id SERIAL PRIMARY KEY,
        razorpay_enabled BOOLEAN DEFAULT false,
        cod_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id SERIAL PRIMARY KEY,
        email_notifications BOOLEAN DEFAULT true,
        sms_notifications BOOLEAN DEFAULT false,
        push_notifications BOOLEAN DEFAULT true,
        order_updates BOOLEAN DEFAULT true,
        marketing_emails BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Insert default data if tables are empty
    const storeCount = await sql`SELECT COUNT(*) as count FROM store_settings`
    if (storeCount[0].count === 0) {
      await sql`
        INSERT INTO store_settings (store_name, store_description, store_email, store_phone, store_address, currency, timezone, tax_rate, shipping_fee, free_shipping_threshold, privacy_policy_url, terms_of_service_url, data_deletion_url, shipping_policy_url, cancellation_refund_url) 
        /* Updated values from Golden Threads to Suktara */
        VALUES ('Suktara', 'Premium fashion for women and kids', 'info@suktara.com', '+91-9876543210', 'Fashion Street, Mumbai, India', 'INR', 'Asia/Kolkata', 0, 50, 999, '', '', '', '', '')
      `
    }

    const paymentCount = await sql`SELECT COUNT(*) as count FROM payment_settings`
    if (paymentCount[0].count === 0) {
      await sql`
        INSERT INTO payment_settings (razorpay_enabled, cod_enabled) 
        VALUES (false, true)
      `
    }

    const notificationCount = await sql`SELECT COUNT(*) as count FROM notification_settings`
    if (notificationCount[0].count === 0) {
      await sql`
        INSERT INTO notification_settings (email_notifications, sms_notifications, push_notifications, order_updates, marketing_emails) 
        VALUES (true, false, true, true, false)
      `
    }
  } catch (error) {
    console.error("Error ensuring tables exist:", error)
  }
}

export async function GET() {
  try {
    await ensureTablesExist()

    const [storeSettings, paymentSettings, notificationSettings] = await Promise.all([
      sql`SELECT * FROM store_settings ORDER BY id DESC LIMIT 1`,
      sql`SELECT * FROM payment_settings ORDER BY id DESC LIMIT 1`,
      sql`SELECT * FROM notification_settings ORDER BY id DESC LIMIT 1`,
    ])

    return NextResponse.json({
      store: storeSettings[0] || {
        /* Updated default fallback values from Golden Threads to Suktara */
        store_name: "Suktara",
        store_description: "Premium fashion for women and kids",
        store_email: "info@suktara.com",
        store_phone: "+91-9876543210",
        store_address: "Fashion Street, Mumbai, India",
        currency: "INR",
        timezone: "Asia/Kolkata",
        tax_rate: 0, // explicit 0 returned in case UI expects it elsewhere
        shipping_fee: 50,
        free_shipping_threshold: 999,
        privacy_policy_url: "",
        terms_of_service_url: "",
        data_deletion_url: "",
        shipping_policy_url: "",
        cancellation_refund_url: "",
      },
      payments: paymentSettings[0] || {
        razorpay_enabled: false,
        cod_enabled: true,
      },
      notifications: notificationSettings[0] || {
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        order_updates: true,
        marketing_emails: false,
      },
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch settings",
        store: {
          /* Updated error fallback values from Golden Threads to Suktara */
          store_name: "Suktara",
          store_description: "Premium fashion for women and kids",
          store_email: "info@suktara.com",
          store_phone: "+91-9876543210",
          store_address: "Fashion Street, Mumbai, India",
          currency: "INR",
          timezone: "Asia/Kolkata",
          tax_rate: 0, // explicit 0
          shipping_fee: 50,
          free_shipping_threshold: 999,
          privacy_policy_url: "",
          terms_of_service_url: "https://merchant.razorpay.com/policy/R5cz3NGYpozRFX/terms",
          data_deletion_url: "",
          shipping_policy_url: "https://merchant.razorpay.com/policy/R5cz3NGYpozRFX/shipping",
          cancellation_refund_url: "https://merchant.razorpay.com/policy/R5cz3NGYpozRFX/refund",
        },
        payments: {
          razorpay_enabled: false,
          cod_enabled: true,
        },
        notifications: {
          email_notifications: true,
          sms_notifications: false,
          push_notifications: true,
          order_updates: true,
          marketing_emails: false,
        },
      },
      { status: 200 },
    )
  }
}

export async function PUT(request: Request) {
  try {
    await ensureTablesExist()

    const body = await request.json()
    const { store, payments, notifications } = body

    const results = []

    if (store) {
      const result = await sql`
        UPDATE store_settings 
        SET 
          /* Updated default fallback values from Golden Threads to Suktara */
          store_name = ${store.store_name || "Suktara"},
          store_description = ${store.store_description || "Premium fashion for women and kids"},
          store_email = ${store.store_email || "info@suktara.com"},
          store_phone = ${store.store_phone || "+91-9876543210"},
          store_address = ${store.store_address || "Fashion Street, Mumbai, India"},
          currency = ${store.currency || "INR"},
          timezone = ${store.timezone || "Asia/Kolkata"},
          tax_rate = 0, -- force 0 tax rate on save
          shipping_fee = ${store.shipping_fee || 50},
          free_shipping_threshold = ${store.free_shipping_threshold || 999},
          privacy_policy_url = ${store.privacy_policy_url || ""},
          terms_of_service_url = ${store.terms_of_service_url || ""},
          data_deletion_url = ${store.data_deletion_url || ""},
          shipping_policy_url = ${store.shipping_policy_url || ""},
          cancellation_refund_url = ${store.cancellation_refund_url || ""},
          updated_at = NOW()
        WHERE id = (SELECT id FROM store_settings ORDER BY id DESC LIMIT 1)
      `
      results.push({ store: result })
    }

    if (payments) {
      const result = await sql`
        UPDATE payment_settings 
        SET 
          razorpay_enabled = ${payments.razorpay_enabled || false},
          cod_enabled = ${payments.cod_enabled !== false},
          updated_at = NOW()
        WHERE id = (SELECT id FROM payment_settings ORDER BY id DESC LIMIT 1)
      `
      results.push({ payments: result })
    }

    if (notifications) {
      const result = await sql`
        UPDATE notification_settings 
        SET 
          email_notifications = ${notifications.email_notifications !== false},
          sms_notifications = ${notifications.sms_notifications || false},
          push_notifications = ${notifications.push_notifications !== false},
          order_updates = ${notifications.order_updates !== false},
          marketing_emails = ${notifications.marketing_emails || false},
          updated_at = NOW()
        WHERE id = (SELECT id FROM notification_settings ORDER BY id DESC LIMIT 1)
      `
      results.push({ notifications: result })
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      results,
    })
  } catch (error: unknown) {
    console.error("Error updating settings:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ error: "Failed to update settings", details: errorMessage }, { status: 500 })
  }
}
