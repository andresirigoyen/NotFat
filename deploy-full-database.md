# Deploy Full Database Migration - NotFat 70+ Tables

## 📊 Migration Summary

- **Total Tables**: 55 tables (including analytics views)
- **Total Lines**: 1,251 lines of SQL
- **Migration File**: `full-migration.sql`
- **Generated**: Using Prisma schema diff from empty

## 🗄️ Table Categories

### Core User Tables
- `profiles` - User profiles and settings
- `user_activity_profile` - Activity levels and preferences
- `health_settings` - Health platform integrations
- `health_daily_snapshots` - Daily health metrics

### Nutrition & Meals
- `meals` - Meal records
- `food_items` - Individual food items
- `nutrition_goals` - User nutrition objectives
- `hydration_goals` - Water intake goals
- `water_logs` - Daily water tracking
- `body_metrics` - Weight, body fat tracking

### Scanning & Contributions
- `scan_events` - Barcode scanning history
- `task_queue` - Async processing tasks
- `contribution_queue` - User contributions for products

### Favorites & Recipes
- `favorite_meals` - User favorite meals
- `favorite_meal_items` - Items in favorite meals
- `recipes` - AI-generated recipes
- `recipe_items` - Recipe ingredients

### AI & Coaching
- `coach_messages` - AI coach conversations
- `coach_insights` - AI-generated insights
- `recommendation_sessions` - Recipe recommendations

### Professional Services
- `nutritionists` - Nutritionist profiles
- `institutions` - Healthcare institutions
- `nutrition_guidelines` - Professional nutrition plans
- `profile_nutritionists` - User-nutritionist links

### Payments & Subscriptions
- `subscriptions` - User subscriptions
- `payments` - Payment records
- `pricing_ab_tests` - A/B testing data
- `offer_code_attempts` - Promo code usage
- `promo_codes` - Promotional codes
- `promo_code_payments` - Promo code payments
- `payments_analytics` - Payment analytics

### User Engagement
- `notification_logs` - Notification history
- `notification_preferences` - User notification settings
- `daily_tips` - Daily nutrition tips
- `daily_tips_used` - Tip tracking

### Analytics & Reporting
- `payment_funnel_conversion` - Conversion analytics
- `daily_payment_metrics` - Daily payment stats
- `ab_test_comparison` - A/B test results
- `scan_events_daily_stats` - Scanner analytics
- `scanner_daily_stats` - Scanner performance
- `geography_payment_comparison` - Regional payment data

### Retention & Recovery
- `cancellation_with_plan` - Cancellation with offers
- `cancellation_with_plan_and_payment` - Enhanced recovery
- `cancellation_recovery_attempts` - Recovery attempts

### Content Management
- `additives` - Food additive database
- `feedback` - User feedback
- `influencers` - Influencer management
- `cron_job_logs` - System job logs
- `marketing_campaign_history` - Campaign tracking

### Guideline System
- `guideline_days` - Nutrition plan days
- `guideline_trainings` - Workout plans
- `guideline_meals` - Planned meals
- `guideline_meal_items` - Meal ingredients

## 🚀 Deployment Steps

### 1. Backup Current Database
```sql
-- Create backup before migration
CREATE TABLE profiles_backup AS TABLE profiles;
-- Repeat for all existing tables
```

### 2. Execute Migration
```bash
# Option A: Using Supabase Dashboard
# 1. Go to Supabase Dashboard > SQL Editor
# 2. Copy contents of full-migration.sql
# 3. Execute script

# Option B: Using CLI (requires DATABASE_URL)
psql $DATABASE_URL -f full-migration.sql
```

### 3. Verify Migration
```sql
-- Check table count
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Verify key tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'meals', 'food_items', 'scan_events', 'coach_insights');
```

### 4. Update RLS Policies
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- Repeat for all user-facing tables

-- Create policies for user data access
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
```

### 5. Create Indexes
```sql
-- Performance indexes for frequently queried columns
CREATE INDEX idx_meals_user_id_meal_at ON meals(user_id, meal_at);
CREATE INDEX idx_food_items_meal_id ON food_items(meal_id);
CREATE INDEX idx_scan_events_user_id_created_at ON scan_events(user_id, created_at);
```

## 🔧 Post-Migration Tasks

### 1. Update Environment Variables
```bash
# Ensure all required env vars are set
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 2. Update Frontend
- Update React Query cache keys
- Add new table hooks
- Update TypeScript types
- Test new functionality

### 3. Edge Functions
- Deploy updated Edge Functions
- Test new table integrations
- Monitor performance

## ⚠️ Important Notes

### Data Safety
- **Always backup before migration**
- Test in staging environment first
- Monitor for performance issues

### Performance
- Migration may take several minutes
- Index creation happens after tables
- Monitor database load during deployment

### Rollback Plan
```sql
-- If migration fails, restore from backup
DROP TABLE IF EXISTS profiles;
ALTER TABLE profiles_backup RENAME TO profiles;
-- Repeat for all critical tables
```

## 📈 Expected Benefits

### Enhanced Functionality
- Complete barcode scanning workflow
- Voice input processing
- AI-powered health insights
- Scientific goal calculations

### Improved Analytics
- Comprehensive user behavior tracking
- Payment funnel analysis
- Geographic performance data

### Better User Experience
- Personalized nutrition recommendations
- Professional nutritionist integration
- Advanced meal planning
- Enhanced social features

## 🎯 Next Steps

1. **Execute Migration** - Run the SQL script
2. **Verify Tables** - Confirm all 55 tables created
3. **Test Features** - Validate new functionality
4. **Monitor Performance** - Check database performance
5. **Update Documentation** - Update API docs and schemas

## 📞 Support

If you encounter issues:
1. Check Supabase logs for errors
2. Verify environment variables
3. Test with a small dataset first
4. Contact database administrator for assistance

---

**Migration Status**: Ready for deployment
**Tables**: 55 total
**Generated**: $(date)
**Schema Version**: Latest from prisma/schema.prisma
