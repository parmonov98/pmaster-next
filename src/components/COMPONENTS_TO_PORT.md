# Components Yet to Port

The following large components still need to be manually ported from React Router to Next.js:

## 1. CustomerHistoryTab.tsx (869 lines)
**Source:** `/sessions/trusting-affectionate-clarke/mnt/pmaster.frontend/src/components/CustomerHistoryTab.tsx`
**Conversion notes:**
- Replace `useNavigate()` → `useRouter()`  
- Replace `useParams()` from react-router-dom → `useParams()` from next/navigation
- Replace `navigate(path)` → `router.push(path)`
- Update all Link `to=` props → `href=`
- Replace `useTranslation()` → `useTranslations()` from next-intl
- Replace `import { supabase }` → `import { createClient } from '@/lib/supabase/client'`
- Add `'use client'` directive at top

## 2. DiagnosticList.tsx (271 lines)
**Source:** `/sessions/trusting-affectionate-clarke/mnt/pmaster.frontend/src/components/DiagnosticList.tsx`
**Conversion notes:**
- Same navigation conversions as above
- Keep all Tailwind classes and lucide-react icons identical
- Maintain all database query logic

## 3. CompletionList.tsx (379 lines)
**Source:** `/sessions/trusting-affectionate-clarke/mnt/pmaster.frontend/src/components/CompletionList.tsx`
**Conversion notes:**
- Same navigation conversions as above
- Watch for `useMatch` - may need to be replaced with pathname checking
- Keep all tab navigation logic

## 4. DiagnosedRepairsTab.tsx (472 lines)
**Source:** `/sessions/trusting-affectionate-clarke/mnt/pmaster.frontend/src/components/DiagnosedRepairsTab.tsx`
**Conversion notes:**
- Replace all router-dom imports
- Keep SMS sending logic intact
- Maintain form state management

## 5. ReadyForPickupTab.tsx (612 lines)
**Source:** `/sessions/trusting-affectionate-clarke/mnt/pmaster.frontend/src/components/ReadyForPickupTab.tsx`
**Conversion notes:**
- Replace router-dom imports
- Important: `isSmsEnabled` comes from `businessProfile?.sms_enabled`
- Keep pickup code generation and SMS logic

## 6. ServicesTab.tsx (291 lines)
**Source:** `/sessions/trusting-affectionate-clarke/mnt/pmaster.frontend/src/components/ServicesTab.tsx`
**Conversion notes:**
- Replace router-dom imports  
- Keep search functionality
- Maintain all database queries

## Completed Components (18 total)
✓ Sidebar.tsx
✓ BottomNav.tsx  
✓ AuthButton.tsx
✓ ProfileDropdown.tsx
✓ SEOHead.tsx
✓ FloatingFeedbackButton.tsx
✓ FeedbackModal.tsx
✓ DiagnosticPlaceholder.tsx
✓ CompletionPlaceholder.tsx
✓ PlanLimitBanner.tsx
✓ SMSStatusBadge.tsx
✓ CameraCapture.tsx
✓ PhotoSourceSheet.tsx
✓ YandexMapLocationPicker.tsx
✓ SubscriptionSection.tsx
✓ LanguageToggle.tsx (already existed)
✓ JsonLd.tsx (already existed)

## Remaining (6 components)
□ CustomerHistoryTab.tsx
□ DiagnosticList.tsx
□ CompletionList.tsx
□ DiagnosedRepairsTab.tsx
□ ReadyForPickupTab.tsx
□ ServicesTab.tsx
