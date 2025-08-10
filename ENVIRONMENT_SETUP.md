# 🌟 Golden Threads E-commerce Platform - Environment Setup Guide

## 🚀 Quick Setup

1. **Clone and setup environment:**
   \`\`\`bash
   git clone <your-repo>
   cd golden-threads-ecommerce
   npm install
   npm run setup
   \`\`\`

2. **Edit your environment file:**
   \`\`\`bash
   # Edit .env.local with your actual values
   nano .env.local
   \`\`\`

## 📋 Required Services Setup

### 1. 🗄️ Database Setup (Choose One)

#### Option A: Neon (Recommended for Production)
1. Go to [Neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to `DATABASE_URL` in `.env.local`

#### Option B: Railway
1. Go to [Railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy connection string from Variables tab
4. Add to `DATABASE_URL` in `.env.local`

#### Option C: Local PostgreSQL (Development)
\`\`\`bash
# Install PostgreSQL
brew install postgresql  # macOS
sudo apt install postgresql  # Ubuntu

# Create database
createdb golden_threads_dev

# Use: postgresql://postgres:password@localhost:5432/golden_threads_dev
\`\`\`

### 2. 🔥 Firebase Setup

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create new project: "golden-threads-prod"
   - Enable Google Analytics (optional)

2. **Enable Authentication:**
   - Go to Authentication → Sign-in method
   - Enable Email/Password
   - Enable Google (optional)

3. **Enable Storage:**
   - Go to Storage → Get started
   - Start in test mode (configure rules later)

4. **Get Web App Config:**
   - Go to Project Settings → General
   - Add web app → Register app
   - Copy config values to `.env.local`

5. **Generate Service Account:**
   - Go to Project Settings → Service accounts
   - Generate new private key
   - Add values to `.env.local`

### 3. 📧 Email Service Setup

#### Option A: Resend (Recommended)
1. Go to [Resend.com](https://resend.com)
2. Create account
3. Get API key from dashboard
4. Add to `RESEND_API_KEY` in `.env.local`

#### Option B: SendGrid
1. Go to [SendGrid.com](https://sendgrid.com)
2. Create account
3. Create API key with Mail Send permissions
4. Add to `SENDGRID_API_KEY` in `.env.local`

## 🔧 Configuration Steps

### 1. Database Configuration
\`\`\`bash
# Test database connection
npm run db:test

# Run migrations (development)
npm run db:migrate
\`\`\`

### 2. Environment Validation
\`\`\`bash
# Validate all environment variables
npm run env:validate
\`\`\`

### 3. Firebase Configuration
\`\`\`typescript
// Your Firebase config should look like:
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyExample123456789"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="golden-threads-prod.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="golden-threads-prod"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="golden-threads-prod.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef123456"
\`\`\`

## 🔒 Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env.local` to version control
- ✅ Use different keys for development and production
- ✅ Rotate secrets regularly
- ✅ Use strong, unique passwords

### 2. Firebase Security
- ✅ Configure Firestore security rules
- ✅ Set up Storage security rules
- ✅ Enable App Check for production
- ✅ Monitor usage in Firebase Console

### 3. Database Security
- ✅ Use connection pooling
- ✅ Enable SSL connections
- ✅ Regularly backup data
- ✅ Monitor query performance

## 🌍 Production Deployment

### Vercel Deployment
1. **Connect Repository:**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Import your GitHub repository

2. **Configure Environment Variables:**
   - Add all production environment variables
   - Use production Firebase project
   - Use production database URL

3. **Domain Configuration:**
   - Add custom domain
   - Update `NEXT_PUBLIC_BASE_URL`

### Environment-Specific Values

#### Development
\`\`\`env
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NODE_ENV="development"
DEBUG_MODE="true"
\`\`\`

#### Production
\`\`\`env
NEXT_PUBLIC_BASE_URL="https://goldenthreads.com"
NODE_ENV="production"
DEBUG_MODE="false"
\`\`\`

## 🧪 Testing Your Setup

### 1. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

### 2. Check Console for:
- ✅ Database connection successful
- ✅ Firebase initialized
- ✅ Email service configured
- ✅ Environment variables validated

### 3. Test Features:
- ✅ User registration/login
- ✅ Product catalog loading
- ✅ Image uploads
- ✅ Email notifications

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Error
\`\`\`bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
npm run db:test

# Common fixes:
# - Ensure database exists
# - Check network access
# - Verify credentials
\`\`\`

#### Firebase Authentication Error
\`\`\`bash
# Check Firebase config
npm run env:validate

# Common fixes:
# - Verify all 6 Firebase config values
# - Check Firebase project settings
# - Ensure Authentication is enabled
\`\`\`

#### Email Service Error
\`\`\`bash
# Test email configuration
node -e "console.log(process.env.RESEND_API_KEY ? 'Resend configured' : 'No email service')"

# Common fixes:
# - Verify API key
# - Check service status
# - Test with simple email
\`\`\`

## 📞 Support

If you encounter issues:

1. **Check the logs:**
   \`\`\`bash
   npm run dev
   # Look for error messages in console
   \`\`\`

2. **Validate environment:**
   \`\`\`bash
   npm run env:validate
   \`\`\`

3. **Test individual services:**
   \`\`\`bash
   npm run db:test
   \`\`\`

4. **Common solutions:**
   - Restart development server
   - Clear Next.js cache: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

## ✅ Environment Variables Checklist

- [ ] `DATABASE_URL` configured and tested
- [ ] All 6 Firebase client config variables set
- [ ] All 3 Firebase admin config variables set
- [ ] Email service configured (Resend or SendGrid)
- [ ] `NEXT_PUBLIC_BASE_URL` set correctly
- [ ] `ADMIN_EMAIL` configured
- [ ] All security secrets are unique and secure
- [ ] Development vs production values configured
- [ ] All services tested and working

## 🎯 Next Steps

After environment setup:

1. **Run database migrations:**
   \`\`\`bash
   npm run db:migrate
   \`\`\`

2. **Seed initial data:**
   \`\`\`bash
   npm run db:seed
   \`\`\`

3. **Start development:**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Deploy to production:**
   - Configure Vercel environment variables
   - Deploy and test all features

---

**🌟 Golden Threads E-commerce Platform**  
*Crafting digital excellence since 2024*
