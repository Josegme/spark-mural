

## Fix: Remove duplicate event creation in `generatePaymentLinkForClient()`

### Problem
`generatePaymentLinkForClient()` creates the event via INSERT **and** then generates a payment link. When the client pays, the MP webhook also creates the event, resulting in duplicates.

### Change (single function, single file)
In `src/hooks/useCreateEvent.ts`, rewrite `generatePaymentLinkForClient()` to:

1. **Remove** the 3 `generateQRToken()` lines (467-469)
2. **Remove** the entire event INSERT block (lines 475-508): `eventData` object, the `supabase.from('eventos').insert()` call, and the error check
3. **Remove** `evento_id: eventResult.id` from the `create-payment-preference` body (line 513)
4. **Add** `tenant_id: tenantId` to the `create-payment-preference` body so the webhook knows which tenant to associate

The resulting function will:
- Calculate price
- Determine tenantId
- Call `create-payment-preference` directly (no event INSERT)
- Return the checkout URL

No other files or functions are touched.

