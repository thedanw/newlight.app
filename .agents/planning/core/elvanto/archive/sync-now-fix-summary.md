# Elvanto Sync "Sync Now" Button Fix - Summary

## Original Issue
The "Sync Now" button in the ScheduleTab was failing with:
- **CORS Error**: `Access to fetch at 'https://rupujdsalfekudambviu.supabase.co/functions/v1/elvanto-sync-worker' from origin 'http://localhost:5173' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
- **500 Internal Server Error**: `POST https://rupujdsalfekudambviu.supabase.co/functions/v1/elvanto-sync-worker net::ERR_FAILED 500 (Internal Server Error)`
- **Client Error**: `[ScheduleTab] Sync trigger error: Failed to fetch`

## Root Causes Identified

### 1. CORS Headers Missing on Error Responses
The Edge Function was throwing unhandled exceptions (500 errors) without CORS headers. When the Supabase gateway returns a 500, it doesn't include the function's CORS headers, causing the browser to block the response.

### 2. Variable Name Typo in Edge Function
In `runSync()`, the code referenced `lastCredentialError` but the variable was named `lastCredentialError1`, causing a ReferenceError that resulted in a 500.

### 3. JWT Authentication Misconfiguration
- The Edge Function was deployed with `--no-verify-jwt` flag, which bypassed the Supabase gateway's JWT validation
- This caused the gateway to skip CORS header handling entirely
- The function was manually validating JWTs using `supabase.auth.getUser(jwt)` instead of using gateway-provided headers

### 4. Missing `apikey` Header in Client Requests
When `verify_jwt=true`, the Supabase gateway requires the `apikey` header (anon/publishable key) in addition to the Authorization header. The client code was not sending this header.

### 5. Incorrect JWT Retrieval in Client (Previously Fixed)
The handoff file notes this was already fixed: changed from `supabase.auth.getUser()` to `supabase.auth.getSession()` to properly get the access token.

## Fixes Applied

### Edge Function (`supabase/functions/elvanto-sync-worker/index.ts`)

1. **Global Try-Catch Wrapper** - Wrapped the entire HTTP handler in a try-catch to ensure CORS headers are always returned, even on unhandled exceptions:
   ```typescript
   serve(async (req) => {
     try {
       // ... all handler logic
     } catch (error) {
       return new Response(JSON.stringify({
         error: 'Internal server error',
         message: error instanceof Error ? error.message : String(error)
       }), {
         status: 500,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' }
       });
     }
   });
   ```

2. **Fixed Variable Name** - Changed `lastCredentialError` to `lastCredentialError1` in the error message.

3. **Gateway Header Authentication** - Updated auth logic to use gateway-provided headers when `verify_jwt=true`:
   ```typescript
   const userId = req.headers.get('x-supabase-user-id');
   const userEmail = req.headers.get('x-supabase-user-email');
   const userRole = req.headers.get('x-supabase-user-role');
   
   if (userId) {
     user = { id: userId, email: userEmail, role: userRole || 'authenticated' };
     role = user.role;
   } else {
     // Fallback: manual validation for local development
   }
   ```

4. **Debug Logging** - Added console.log statements for troubleshooting.

### Client Code (`src/content/plugins/elvanto-sync/sync/trigger-sync.ts` and `public/content/plugins/elvanto-sync/sync/trigger-sync.ts`)

1. **Added `apikey` Header** - Both `triggerElvantoSync()` and `testElvantoConnection()` now include the anon key:
   ```typescript
   const anonKey = getSupabaseAnonKey();
   if (anonKey) {
     headers.apikey = anonKey;
   }
   ```

### Deployment Configuration

- **Redeployed without `--no-verify-jwt` flag**: `npx supabase functions deploy elvanto-sync-worker --project-ref rupujdsalfekudambviu --no-verify-jwt=false`
- This enables proper JWT verification by the Supabase gateway and correct CORS header handling

## Verification Results

| Test | Result |
|------|--------|
| CORS Preflight (OPTIONS) | ✅ Returns proper headers including `Access-Control-Allow-Origin: *` |
| Error Responses (400, 401, 500) | ✅ Include CORS headers |
| Function Deployment | ✅ `verify_jwt: true` |
| Build | ✅ Completes successfully |

## Current Behavior

- **Authenticated Users**: The "Sync Now" button will work when a user is signed in (their JWT is sent via `Authorization` header, anon key via `apikey` header)
- **Unauthenticated Requests**: Returns 401 "Unauthorized - service role or authenticated user required" with proper CORS headers
- **CORS Errors**: Fixed - all responses include proper CORS headers
- **Legacy JWTs**: The Supabase gateway rejects legacy `anon` and `service_role` JWTs when `verify_jwt=true`. Only new publishable/secret keys or valid user JWTs from authenticated users are accepted. This is expected behavior.

## Additional Fixes Applied (Post-Summary)

### Edge Function - Credential Error Handling
- Fixed `getCredentials()` to return error info in the response object instead of relying on closure variable
- Updated `runSync()` to use `credentials.error` from the returned object

### Edge Function - Legacy JWT Fallback
- Added fallback parsing of JWT payload to detect `service_role` and `authenticated` roles
- This handles cases where gateway doesn't provide headers but JWT is valid (local development)

### Database Schema - Missing Column
- **Issue**: `encryption_key_encrypted` column was missing from remote database `elvanto_settings` table
- **Root Cause**: Migration `20260829130000_create_elvanto_settings.sql` included the column but it wasn't present in remote DB
- **Fix**: Created migration `20260927124952_add_encryption_key_to_elvanto_settings.sql` to add the missing column
- **Applied**: `npx supabase db push --include-all --project-ref rupujdsalfekudambviu`

### Edge Function - Empty Encryption Key Validation
- **Issue**: `encryption_key_encrypted` column existed but was empty string (`""`), causing validation to fail with "settings row not found or missing encryption key"
- **Root Cause**: Validation used `!data?.encryption_key_encrypted` which evaluates to `true` for empty strings
- **Fix**: Updated validation to explicitly check for `null`, `undefined`, or empty/whitespace strings:
  ```typescript
  } else if (!data.encryption_key_encrypted || data.encryption_key_encrypted.trim() === '') {
    lastCredentialError1 = 'settings row missing encryption_key_encrypted';
  ```
- **Deployed**: `npx supabase functions deploy elvanto-sync-worker --project-ref rupujdsalfekudambviu --no-verify-jwt=false`

## Files Modified

1. `supabase/functions/elvanto-sync-worker/index.ts` - Edge Function
2. `src/content/plugins/elvanto-sync/sync/trigger-sync.ts` - Client helper (src)
3. `public/content/plugins/elvanto-sync/sync/trigger-sync.ts` - Client helper (public copy)
4. `supabase/migrations/20260927124952_add_encryption_key_to_elvanto_settings.sql` - New migration
3. `public/content/plugins/elvanto-sync/sync/trigger-sync.ts` - Client helper (public copy)

## Environment

- Supabase Project: `rupujdsalfekudambviu`
- Edge Function: `elvanto-sync-worker` (v15+)
- Dev Server: `http://localhost:5173`
- Edge Function URL: `https://rupujdsalfekudambviu.supabase.co/functions/v1/elvanto-sync-worker`