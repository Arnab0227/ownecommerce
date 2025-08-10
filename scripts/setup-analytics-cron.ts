// This script sets up cron jobs for analytics data processing
// Run this script to configure automated analytics updates

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function setupAnalyticsCronJobs() {
  try {
    console.log("Setting up analytics cron jobs...")

    // Create a function to run daily analytics updates
    await sql`
      CREATE OR REPLACE FUNCTION run_daily_analytics_update()
      RETURNS void AS $$
      BEGIN
        -- Update daily analytics
        PERFORM update_product_analytics();
        
        -- Calculate trending products for all periods
        PERFORM calculate_trending_products('daily');
        PERFORM calculate_trending_products('weekly');
        PERFORM calculate_trending_products('monthly');
        
        -- Log the update
        INSERT INTO email_reports (
          report_type, 
          recipient_email, 
          period_start, 
          period_end, 
          status
        ) VALUES (
          'analytics_update',
          'system@goldenthreads.com',
          CURRENT_DATE - INTERVAL '1 day',
          CURRENT_DATE - INTERVAL '1 day',
          'completed'
        );
        
        RAISE NOTICE 'Daily analytics update completed at %', NOW();
      END;
      $$ LANGUAGE plpgsql;
    `

    // Create a function for monthly email reports
    await sql`
      CREATE OR REPLACE FUNCTION send_monthly_analytics_report()
      RETURNS void AS $$
      DECLARE
        admin_email TEXT;
      BEGIN
        -- Get admin email from environment or default
        admin_email := COALESCE(current_setting('app.admin_email', true), 'admin@goldenthreads.com');
        
        -- Insert a request for monthly report
        INSERT INTO email_reports (
          report_type,
          recipient_email,
          period_start,
          period_end,
          status
        ) VALUES (
          'monthly_trending',
          admin_email,
          CURRENT_DATE - INTERVAL '30 days',
          CURRENT_DATE - INTERVAL '1 day',
          'pending'
        );
        
        RAISE NOTICE 'Monthly analytics report queued for %', admin_email;
      END;
      $$ LANGUAGE plpgsql;
    `

    // If using PostgreSQL with pg_cron extension (available on some cloud providers)
    try {
      // Schedule daily analytics update at 2 AM
      await sql`
        SELECT cron.schedule(
          'daily-analytics-update',
          '0 2 * * *',
          'SELECT run_daily_analytics_update();'
        );
      `
      console.log("✅ Scheduled daily analytics update cron job")
    } catch (error) {
      console.log("⚠️  pg_cron not available, skipping cron job setup")
      console.log("   You'll need to set up external cron jobs or use a task scheduler")
    }

    try {
      // Schedule monthly report on the 1st of each month at 9 AM
      await sql`
        SELECT cron.schedule(
          'monthly-analytics-report',
          '0 9 1 * *',
          'SELECT send_monthly_analytics_report();'
        );
      `
      console.log("✅ Scheduled monthly analytics report cron job")
    } catch (error) {
      console.log("⚠️  pg_cron not available for monthly reports")
    }

    // Create a cleanup function for old analytics data
    await sql`
      CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
      RETURNS void AS $$
      BEGIN
        -- Delete product views older than 1 year
        DELETE FROM product_views 
        WHERE created_at < CURRENT_DATE - INTERVAL '1 year';
        
        -- Delete old email report logs (keep 6 months)
        DELETE FROM email_reports 
        WHERE created_at < CURRENT_DATE - INTERVAL '6 months'
        AND status IN ('sent', 'failed');
        
        -- Delete old trending data (keep 3 months)
        DELETE FROM trending_products 
        WHERE created_at < CURRENT_DATE - INTERVAL '3 months';
        
        RAISE NOTICE 'Analytics data cleanup completed at %', NOW();
      END;
      $$ LANGUAGE plpgsql;
    `

    try {
      // Schedule cleanup on the 1st of each month at 3 AM
      await sql`
        SELECT cron.schedule(
          'analytics-cleanup',
          '0 3 1 * *',
          'SELECT cleanup_old_analytics_data();'
        );
      `
      console.log("✅ Scheduled analytics cleanup cron job")
    } catch (error) {
      console.log("⚠️  pg_cron not available for cleanup job")
    }

    console.log("\n📋 Manual Cron Job Setup Instructions:")
    console.log("If pg_cron is not available, set up these cron jobs manually:")
    console.log("\n1. Daily Analytics Update (2 AM daily):")
    console.log("   0 2 * * * curl -X POST https://yourdomain.com/api/analytics/update")
    console.log("\n2. Monthly Report (9 AM on 1st of month):")
    console.log("   0 9 1 * * curl -X POST https://yourdomain.com/api/analytics/email-report")
    console.log("\n3. Monthly Cleanup (3 AM on 1st of month):")
    console.log("   0 3 1 * * curl -X POST https://yourdomain.com/api/analytics/cleanup")

    console.log("\n✅ Analytics cron job setup completed!")
  } catch (error) {
    console.error("❌ Error setting up analytics cron jobs:", error)
    throw error
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupAnalyticsCronJobs()
    .then(() => {
      console.log("Setup completed successfully!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Setup failed:", error)
      process.exit(1)
    })
}

export { setupAnalyticsCronJobs }
