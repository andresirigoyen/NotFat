#!/bin/bash

echo "🚀 Manual Edge Functions Deployment"
echo "=================================="
echo ""

# Check if we have the functions directory
if [ ! -d "supabase/functions" ]; then
    echo "❌ supabase/functions directory not found"
    exit 1
fi

echo "📦 Functions to deploy:"
ls -la supabase/functions/

echo ""
echo "🔧 Manual Deployment Steps:"
echo "1. Open Supabase Dashboard: https://app.supabase.com/project/jcfezqakxulmtdvioxc/functions"
echo ""
echo "2. For each function:"
echo "   a. Click 'New Function'"
echo "   b. Function name: query-product"
echo "   c. Paste content from: supabase/functions/query-product/index.ts"
echo "   d. Click 'Deploy'"
echo ""
echo "   e. Repeat for: calculate-health-score, process-voice-input"
echo ""

echo "📋 Function Files Ready:"
echo "• supabase/functions/query-product/index.ts"
echo "• supabase/functions/calculate-health-score/index.ts" 
echo "• supabase/functions/process-voice-input/index.ts"

echo ""
echo "⚡ Quick Test After Deployment:"
echo "node test-migration.js"
