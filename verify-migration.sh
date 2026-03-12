#!/bin/bash

echo "🧪 Verifying migration after SQL execution..."
echo "=========================================="
echo ""

node test-migration.js

echo ""
echo "✅ If all tables show 'Ready', migration successful!"
echo "❌ If tables show 'not found', check SQL execution"
echo ""
echo "🚀 Next steps:"
echo "1. Deploy Edge Functions: ./deploy-functions.sh"
echo "2. Test app: npx expo start"
echo "3. Push changes: git push origin main"
