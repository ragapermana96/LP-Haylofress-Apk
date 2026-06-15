# Security Specification: Haylofress Ngawi Firestore Rules

## 1. Data Invariants
- **Public Visibility**: Products and Categories are public for reading (`get`, `list`) to allow customers to browse the catalog.
- **Admin Supremacy**: All `write` operations on `products`, `categories`, and `settings` are strictly restricted to authenticated administrators.
- **Identity Integrity**: Admin status is verified against the `/admins` collection using `exists()`.
- **Schema Enforcement**: Every document write must conform to its validation blueprint (isValid).
- **Atomic Immutability**: Critical fields like `createdAt` cannot be modified after creation.

## 2. The "Dirty Dozen" Payloads (Attempted Vulnerabilities)
All of the following MUST return `PERMISSION_DENIED`.

1. **Unauthenticated Write**: Accessing `products` without a valid auth token.
2. **Admin Spoofing**: Attempting to write to `/admins/attacker_uid` as a non-admin to grant self-access.
3. **Price Poisoning**: Updating a product with `priceNormal` as a negative number or a non-number type.
4. **Denial of Wallet (ID)**: Creating a product with an ID that is 2KB long.
5. **Denial of Wallet (Data)**: Creating a product with a `description` string that is 500KB long.
6. **State Injection**: Adding a `role: 'admin'` field to a standard user document if such a field existed.
7. **Unauthorized Listing**: Attempting to `list` documents in `/pixel_analytics` as a regular customer.
8. **Setting Hijack**: Updating the `waNumber` in `/settings/global` as a visitor.
9. **History Erasure**: Attempting to delete logs in `/pixel_analytics`.
10. **Schema Bypass**: Creating a product missing the `unit` or `category` field.
11. **Type Poisoning**: Sending an Array where a String is expected in `metaPixelId`.
12. **Time Spoofing**: Setting a manual `updatedAt` value instead of using `request.time`.

## 3. Test Runner Concept (Mock logic)
Expected Behavior for all payloads above: `status: 403 (PERMISSION_DENIED)`.
