#!/bin/bash

# Golden Threads E-commerce Platform - Environment Setup Script
# This script helps set up the environment for development

echo "🌟 Golden Threads E-commerce Platform Setup"
echo "============================================="

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Backup created as .env.local.backup"
    cp .env.local .env.local.backup
fi

# Copy example file
echo "📋 Creating .env.local from example..."
cp .env.example .env.local

echo ""
echo "✅ Environment file created!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env.local with your actual values"
echo "2. Set up your database (Neon/Railway/Local PostgreSQL)"
echo "3. Configure Firebase project"
echo "4. Set up email service (Resend/SendGrid)"
echo "5. Run 'npm run dev' to start development"
echo ""
echo "🔗 Helpful links:"
echo "• Neon Database: https://neon.tech"
echo "• Firebase Console: https://console.firebase.google.com"
echo "• Resend Email: https://resend.com"
echo "• Railway Database: https://railway.app"
echo ""
echo "🆘 Need help? Check the README.md for detailed setup instructions"
