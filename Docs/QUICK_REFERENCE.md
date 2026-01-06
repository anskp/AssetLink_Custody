# AssetLink Two-Level Isolation - Quick Reference

## 🔑 Authentication Headers

### Required for ALL API requests:
```
X-API-KEY: pk_your_api_key          # Identifies platform (tenantId)
X-SIGNATURE: hmac_signature         # HMAC-SHA256 signature
X-TIMESTAMP: 1234567890             # Unix timestamp
```

### Required for end-user operations:
```
X-USER-ID: user_identifier          # Identifies end user (issuer/investor)
```

## 📊 Data Visibility Rules

| User Type | X-USER-ID | Sees |
|-----------|-----------|------|
| Platform Owner | Not provided | ALL data for their platform |
| End User (Issuer) | `issuer_123` | Only their own assets/listings |
| End User (Investor) | `investor_456` | Only their own portfolio/bids |

## 🔗 Custody Endpoints

### Link Asset (Requires X-USER-ID)
```bash
POST /v1/custody/link
Headers: X-API-KEY, X-USER-ID, X-SIGNATURE, X-TIMESTAMP
Body: { "assetId": "asset_001" }
```

### List Custody Records
```bash
GET /v1/custody
Headers: X-API-KEY, [X-USER-ID], X-SIGNATURE, X-TIMESTAMP

# Without X-USER-ID: Platform owner sees ALL
# With X-USER-ID: End user sees only their own
```

### Get Custody Status
```bash
GET /v1/custody/:assetId
Headers: X-API-KEY, [X-USER-ID], X-SIGNATURE, X-TIMESTAMP
```

## 🏪 Marketplace Endpoints

### Create Listing (Requires X-USER-ID)
```bash
POST /v1/marketplace/listings
Headers: X-API-KEY, X-USER-ID, X-SIGNATURE, X-TIMESTAMP
Body: {
  "assetId": "asset_001",
  "price": "100.00",
  "currency": "USD",
  "quantity": 100,
  "expiryDate": "2026-12-31T23:59:59Z"
}
```

### List All Listings
```bash
GET /v1/marketplace/listings
Headers: X-API-KEY, X-SIGNATURE, X-TIMESTAMP
Query: ?priceMin=10&priceMax=1000&sortBy=price&sortOrder=asc
```

### Get My Listings (Requires X-USER-ID)
```bash
GET /v1/marketplace/my-listings
Headers: X-API-KEY, X-USER-ID, X-SIGNATURE, X-TIMESTAMP
```

### Place Bid (Requires X-USER-ID)
```bash
POST /v1/marketplace/listings/:listingId/bids
Headers: X-API-KEY, X-USER-ID, X-SIGNATURE, X-TIMESTAMP
Body: {
  "amount": "10.00",
  "quantity": 10
}
```

### Accept Bid (Requires X-USER-ID - must be seller)
```bash
POST /v1/marketplace/bids/:bidId/accept
Headers: X-API-KEY, X-USER-ID, X-SIGNATURE, X-TIMESTAMP
```

### Get My Portfolio (Requires X-USER-ID)
```bash
GET /v1/marketplace/my-portfolio
Headers: X-API-KEY, X-USER-ID, X-SIGNATURE, X-TIMESTAMP
```

## 🗄️ Database Schema

### CustodyRecord
```javascript
{
  id: "cuid",
  assetId: "unique_asset_id",
  tenantId: "tenant_platform1",    // Platform owner
  createdBy: "issuer_john",        // End user who created
  status: "LINKED|MINTED|WITHDRAWN|BURNED",
  // ... other fields
}
```

### Listing
```javascript
{
  id: "cuid",
  custodyRecordId: "custody_id",
  tenantId: "tenant_platform1",    // Platform owner
  sellerId: "issuer_john",         // End user who listed
  price: 100.00,
  quantityListed: 100,
  quantitySold: 0,
  // ... other fields
}
```

### Bid
```javascript
{
  id: "cuid",
  listingId: "listing_id",
  tenantId: "tenant_platform1",    // Platform owner
  buyerId: "investor_alice",       // End user who bid
  amount: 10.00,
  quantity: 10,
  status: "PENDING|ACCEPTED|REJECTED",
  // ... other fields
}
```

### Ownership
```javascript
{
  id: "cuid",
  custodyRecordId: "custody_id",
  assetId: "asset_001",
  tenantId: "tenant_platform1",    // Platform owner
  ownerId: "investor_alice",       // End user who owns
  quantity: 10,
  purchasePrice: 10.00,
  currency: "USD",
  acquiredAt: "2026-01-02T12:00:00Z"
}
```

## 🧪 Testing

### Development Mode (Dummy Signature)
```bash
# Set in .env
NODE_ENV=development

# Use dummy signature
X-SIGNATURE: dummy_signature_for_testing
```

### Run Test Script
```bash
cd Assetlink
node scripts/test-two-level-isolation.js
```

## 🚀 Quick Start

### 1. Start Backend
```bash
cd Assetlink
npm run dev
# Server runs on http://localhost:3000
```

### 2. Create API Key (via Dashboard)
```bash
# Login to dashboard at http://localhost:5175
# Navigate to API Keys
# Generate new key → Copy public and secret keys
```

### 3. Test API
```bash
# Link an asset as issuer
curl -X POST http://localhost:3000/v1/custody/link \
  -H "X-API-KEY: your_public_key" \
  -H "X-USER-ID: issuer_john" \
  -H "X-SIGNATURE: dummy_signature_for_testing" \
  -H "X-TIMESTAMP: $(date +%s)" \
  -H "Content-Type: application/json" \
  -d '{"assetId": "test_asset_001"}'
```

## 📚 Documentation Files

- `TWO_LEVEL_ISOLATION_GUIDE.md` - Complete implementation guide
- `IMPLEMENTATION_SUMMARY.md` - What was built and how it works
- `MARKETPLACE_FLOW.md` - User story and flow diagrams
- `QUICK_REFERENCE.md` - This file
- `Assetlink/openapi/openapi.yaml` - Full API specification

## 🔧 Common Issues

### "Tenant ID not found"
- Make sure `X-API-KEY` header is provided
- Verify API key exists in database

### "X-USER-ID header is required"
- Add `X-USER-ID` header for operations that modify data
- Platform owner can omit for read operations

### "You do not have access to this asset"
- Verify `X-USER-ID` matches the asset's `createdBy` field
- Platform owner should omit `X-USER-ID` to see all assets

## 💡 Tips

1. **Platform Owner**: Omit `X-USER-ID` to see all data
2. **End Users**: Always include `X-USER-ID` to see only their data
3. **Testing**: Use `dummy_signature_for_testing` in development
4. **Isolation**: Each tenant's data is completely isolated
5. **Audit**: All operations are logged with tenant and user context
