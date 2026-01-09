# Deployment Trigger

Force Vercel to redeploy with JST timezone fixes.

Timestamp: 2025-01-09 15:40 JST

Changes:
- Fixed timezone handling in `lib/utils.ts`
- Implemented `getCurrentTimeInJST()` function
- Updated `isWithinOperationHours()` to use JST
- Updated `isWithinPurchaseWindow()` to use JST
