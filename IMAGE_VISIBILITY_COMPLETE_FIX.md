# Image Visibility Complete Fix

## Issue Identified ❌
Photos/logos are not visible in:
- Live nominee pages
- Directory listings  
- Admin panel

## Root Causes Found

### 1. Database Views Missing Image Fields
- The `public_nominees` and `admin_nominations` views were not properly exposing image URLs
- Image fields (`headshot_url`, `logo_url`) existed in database but weren't mapped correctly
- Views had incomplete image URL logic

### 2. API Response Mapping Issues
- Nominees API wasn't properly mapping image URLs from database views
- Multiple image field variations not handled consistently
- Missing fallback logic for different image field names

### 3. Frontend Component Issues
- Image utility function had limited fallback logic
- Components weren't checking all possible image field variations
- Missing debug logging to identify image loading issues

## Comprehensive Fixes Applied ✅

### 1. Database Views Fixed
**File**: `IMAGE_VISIBILITY_FIX.sql`
- Updated `public_nominees` view with proper image URL logic
- Fixed `admin_nominations` view to expose all image fields
- Added proper NULL and empty string handling for images
- Included vote count fixes (real + additional votes)

```sql
-- Fixed image URL logic in views
CASE 
  WHEN ne.type = 'person' AND ne.headshot_url IS NOT NULL AND ne.headshot_url != '' THEN ne.headshot_url
  WHEN ne.type = 'company' AND ne.logo_url IS NOT NULL AND ne.logo_url != '' THEN ne.logo_url
  ELSE NULL
END AS image_url
```

### 2. API Response Enhanced
**File**: `src/app/api/nominees/route.ts`
- Enhanced image URL mapping with multiple fallbacks
- Added proper field mapping for both person and company images
- Ensured all image variations are included in API response

```typescript
// Enhanced image URL mapping
const imageUrl = nominee.image_url || 
                (nominee.type === 'person' ? nominee.headshot_url : nominee.logo_url) || 
                null;
```

### 3. Image Utility Improved
**File**: `src/lib/nominee-image.ts`
- Added comprehensive fallback logic for all image field variations
- Included debug logging for development
- Enhanced priority system for image selection
- Better handling of different field naming conventions

### 4. Component Updates
**File**: `src/components/directory/CardNominee.tsx`
- Added debug logging for image issues
- Enhanced image data processing
- Better error handling for missing images

## Key Improvements Made

### Database Level
- ✅ Fixed image URL exposure in database views
- ✅ Added proper NULL/empty string handling
- ✅ Included all image field variations
- ✅ Added performance indexes for image fields

### API Level  
- ✅ Enhanced image URL mapping in nominees API
- ✅ Added multiple fallback options for images
- ✅ Consistent field naming across responses
- ✅ Proper handling of person vs company images

### Frontend Level
- ✅ Improved image utility with better fallbacks
- ✅ Added debug logging for development
- ✅ Enhanced component image handling
- ✅ Better error handling and user feedback

## Testing & Verification

### Run These Scripts
```bash
# Debug current image status
node scripts/debug-image-visibility.js

# Test the fixes
node scripts/test-image-visibility-fix.js
```

### Manual Testing Steps
1. **Database**: Run `IMAGE_VISIBILITY_FIX.sql` in Supabase SQL Editor
2. **API**: Check `/api/nominees` response includes `imageUrl` fields
3. **Directory**: Verify images show in `/directory` page
4. **Admin**: Check images appear in admin panel
5. **Individual Pages**: Test nominee profile pages show images

## Expected Results After Fixes

### ✅ **Images Now Visible In:**
- **Directory Page**: All nominee cards show photos/logos or initials
- **Individual Nominee Pages**: Profile images display correctly  
- **Admin Panel**: Nominations show proper images
- **Top 3 Nominees**: Admin panel shows actual photos

### ✅ **Fallback System:**
- **Real Images**: Show uploaded photos/logos when available
- **Initials Avatars**: Generate colored initials when no image
- **Error Handling**: Graceful fallback for broken image URLs
- **Debug Info**: Console logging in development mode

## Image Field Priority Order

### For Person Nominees:
1. `nomination.imageUrl` (API level)
2. `nominee.imageUrl` (nominee level)  
3. `nominee.headshotUrl` (specific field)
4. `nominee.headshot_url` (database field)
5. `nominee.headshotBase64` (legacy base64)
6. **Fallback**: Initials avatar

### For Company Nominees:
1. `nomination.imageUrl` (API level)
2. `nominee.imageUrl` (nominee level)
3. `nominee.logoUrl` (specific field)
4. `nominee.logo_url` (database field)  
5. `nominee.logoBase64` (legacy base64)
6. **Fallback**: Initials avatar

## Troubleshooting Guide

### If Images Still Not Showing:

1. **Check Database**:
   ```sql
   SELECT type, headshot_url, logo_url FROM nominees WHERE headshot_url IS NOT NULL OR logo_url IS NOT NULL;
   ```

2. **Check API Response**:
   - Visit `/api/nominees` and verify `imageUrl` fields are populated
   - Check browser network tab for image loading errors

3. **Check Console**:
   - Look for debug logs in browser console (development mode)
   - Check for CORS or image loading errors

4. **Verify Image URLs**:
   - Ensure image URLs in database are valid and accessible
   - Check if images are properly uploaded to storage

## Additional Improvements

- **Performance**: Added database indexes for image fields
- **Security**: Proper image URL validation
- **UX**: Consistent fallback experience with initials avatars
- **Debug**: Comprehensive logging for troubleshooting
- **Compatibility**: Support for multiple image field naming conventions

The image visibility issue should now be completely resolved across all parts of the application!