# Cache Busting vs Session Storage - How They Work Together

## Summary

✅ **Cache busting and session storage work independently and safely together.**

The version check system does **NOT** interfere with puzzle session storage. Here's how:

## Storage Keys Used

### Version Check (Cache Busting)
- **Key**: `kenken_app_version`
- **Purpose**: Stores the current app version to detect stale cached HTML
- **Location**: `src/utils/versionCheck.ts` and inline script in `index.html`
- **Behavior**: Only reads/writes this one key, never touches session data

### Puzzle Sessions
- **Key**: `kenken_sessions_v1`
- **Purpose**: Stores puzzle progress, board state, game stats, etc.
- **Location**: `src/App.tsx` (SESSION_KEY constant)
- **Behavior**: Completely separate from version checking

### Other Session Data
- **Key**: `kenken_completed_date` - Tracks daily puzzle completion
- **Key**: `kenken_daily_instructions_shown` - Tracks if instructions were shown (sessionStorage)

## How It Works

1. **Version Check on Page Load**:
   - Checks `localStorage.getItem('kenken_app_version')`
   - Compares with current version from HTML
   - If mismatch: Updates version key and reloads page
   - **Does NOT clear any other localStorage keys**

2. **Page Reload Behavior**:
   - `localStorage` **persists across page reloads** (this is browser behavior)
   - Only `sessionStorage` is cleared when the tab closes
   - Puzzle sessions in `localStorage` remain intact after reload

3. **Session Storage**:
   - Puzzle sessions are stored under `kenken_sessions_v1`
   - This key is never touched by the version check
   - Sessions persist across:
     - Page reloads ✅
     - Browser restarts ✅
     - Version updates ✅
     - Cache clears (as long as localStorage isn't manually cleared) ✅

## Safety Guarantees

✅ **Version check only uses its own key** (`kenken_app_version`)
✅ **Never calls `localStorage.clear()`** or removes session keys
✅ **Page reloads preserve localStorage** (browser default behavior)
✅ **Separate concerns**: Cache busting ≠ Session management

## What Gets Cleared

The version check and cache headers **DO NOT** clear:
- ❌ Puzzle sessions (`kenken_sessions_v1`)
- ❌ Daily completion tracking (`kenken_completed_date`)
- ❌ Any other localStorage data

The version check **ONLY**:
- ✅ Updates `kenken_app_version` key
- ✅ Forces a page reload to get fresh HTML/JS/CSS

## Testing

To verify sessions persist across version updates:

1. Start a puzzle and fill in some numbers
2. Update version in `src/config/version.ts`
3. Rebuild and deploy
4. Visit the site - it should reload automatically
5. Your puzzle progress should still be there! ✅

## If Sessions Are Lost

If puzzle sessions are lost, it's **NOT** due to the version check. Possible causes:
- User manually cleared browser data
- Browser storage quota exceeded
- Incognito/private mode (clears on tab close)
- Browser bug or extension interference

The version check system is designed to be completely non-destructive to user data.

