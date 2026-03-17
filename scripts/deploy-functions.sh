#!/bin/bash

echo "🚀 Deploying Edge Functions to Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Deploy functions
echo "📦 Deploying query-product function..."
supabase functions deploy query-product

echo "🏥 Deploying calculate-health-score function..."
supabase functions deploy calculate-health-score

echo "🎤 Deploying process-voice-input function..."
supabase functions deploy process-voice-input

echo "✅ Edge Functions deployed successfully!"

# Test after deployment
echo "🧪 Testing deployed functions..."
node test-edge-functions.js

echo "🎉 Deployment and testing complete!"
