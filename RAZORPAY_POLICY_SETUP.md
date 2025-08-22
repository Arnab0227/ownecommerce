# Razorpay Policy Links Setup Guide

## Overview
Razorpay requires specific policy pages to be accessible on your website for compliance. These links need to be added to your admin settings and made publicly accessible.

## Required Policy Pages

### 1. Privacy Policy
- **URL Field**: `privacy_policy_url` in admin settings
- **Required for**: Facebook Login + Razorpay
- **Content**: How you collect, use, and protect user data

### 2. Terms of Service
- **URL Field**: `terms_of_service_url` in admin settings  
- **Required for**: Facebook Login + Razorpay
- **Content**: Terms and conditions for using your service

### 3. Shipping Policy
- **URL Field**: `shipping_policy_url` in admin settings
- **Required for**: Razorpay
- **Content**: Shipping methods, delivery times, and charges

### 4. Cancellation & Refund Policy
- **URL Field**: `cancellation_refund_url` in admin settings
- **Required for**: Razorpay
- **Content**: How customers can cancel orders and request refunds

### 5. Data Deletion Instructions
- **URL Field**: `data_deletion_url` in admin settings
- **Required for**: Facebook Login
- **Content**: Instructions for users to delete their data

## How to Add Policy Links

### Step 1: Access Admin Settings
1. Go to `/admin/settings` in your application
2. Navigate to the "Policies" tab
3. You'll see input fields for each policy URL

### Step 2: Create Policy Pages
Create the following pages in your application:

\`\`\`
/privacy-policy
/terms-of-service  
/shipping-policy
/cancellation-refund
/data-deletion
\`\`\`

### Step 3: Add URLs to Settings
In the admin settings, add the full URLs:
- Privacy Policy: `https://yourdomain.com/privacy-policy`
- Terms of Service: `https://yourdomain.com/terms-of-service`
- Shipping Policy: `https://yourdomain.com/shipping-policy`
- Cancellation & Refund: `https://yourdomain.com/cancellation-refund`
- Data Deletion: `https://yourdomain.com/data-deletion`

### Step 4: Make Pages Publicly Accessible
Ensure all policy pages are:
- Publicly accessible (no login required)
- Use HTTPS protocol
- Have proper content relevant to your business
- Are linked in your website footer

## Sample Policy Content

### Privacy Policy Template
\`\`\`
# Privacy Policy

## Information We Collect
- Personal information (name, email, phone)
- Payment information (processed securely)
- Usage data and analytics

## How We Use Information
- Process orders and payments
- Send order updates and notifications
- Improve our services

## Data Protection
- We use industry-standard security measures
- Payment data is processed by Razorpay
- We don't store credit card information

## Contact Us
For privacy concerns, contact: privacy@yourdomain.com
\`\`\`

### Shipping Policy Template
\`\`\`
# Shipping Policy

## Delivery Areas
We deliver across India

## Delivery Time
- Standard: 3-5 business days
- Express: 1-2 business days (additional charges)

## Shipping Charges
- Free shipping on orders above ₹799
- Standard shipping: ₹50

## Order Tracking
Track your order using the tracking ID sent via SMS/Email
\`\`\`

### Cancellation & Refund Policy Template
\`\`\`
# Cancellation & Refund Policy

## Order Cancellation
- Orders can be cancelled within 24 hours of placement
- No cancellation charges for prepaid orders

## Refund Process
- Refunds processed within 5-7 business days
- Original payment method will be credited
- Shipping charges are non-refundable

## Return Policy
- 7-day return policy for defective items
- Items must be in original condition

## Contact for Refunds
Email: refunds@yourdomain.com
Phone: +91 XXXXXXXXXX
\`\`\`

## Verification Checklist

Before going live, ensure:
- [ ] All policy URLs are accessible
- [ ] Pages load without errors
- [ ] Content is relevant to your business
- [ ] URLs use HTTPS protocol
- [ ] Links are added to website footer
- [ ] Admin settings are saved with correct URLs

## Razorpay Integration Notes

Once policy pages are live:
1. Update your Razorpay merchant dashboard with these URLs
2. Submit for review if required
3. Test the complete payment flow
4. Monitor for any compliance issues

## Support

If you need help creating policy content:
- Consult with a legal professional
- Use online policy generators as templates
- Review policies of similar businesses
- Contact Razorpay support for specific requirements
