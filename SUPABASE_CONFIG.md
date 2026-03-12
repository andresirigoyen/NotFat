# Supabase Configuration

## Database Credentials

**Project URL:** https://jcfezqakxulmtdvioxbc.supabase.co

**Publishable Key:** Configured in environment variables
**Secret Key:** Configured in environment variables (never commit to repo)

## Environment Variables

The following environment variables are configured in `.env.local`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://jcfezqakxulmtdvioxbc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=PUBLISHABLE_KEY_PLACEHOLDER
SUPABASE_URL=https://jcfezqakxulmtdvioxbc.supabase.co
SUPABASE_ANON_KEY=PUBLISHABLE_KEY_PLACEHOLDER
SUPABASE_SERVICE_ROLE_KEY=SERVICE_ROLE_KEY_PLACEHOLDER
```

## Usage in Code

The Supabase client is configured in `src/services/SupabaseContext.tsx`:

```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Connection Status

✅ **Connection Verified**: The Supabase connection is working correctly.
✅ **Environment Variables**: All required variables are set and accessible.
✅ **Security**: Secret keys are properly excluded from version control.

## Next Steps

1. Create database tables using the Supabase dashboard
2. Set up authentication policies
3. Configure Row Level Security (RLS)
4. Test API endpoints

## Security Notes

- Never commit `.env.local` to version control
- Use the service role key only in server-side code
- The publishable key is safe for client-side use
- Regularly rotate keys if needed
- All secret keys are stored in `.env.local` which is gitignored
