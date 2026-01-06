# Two-Level Isolation System

## Overview
AssetLink implements a two-level isolation system to support multi-tenant platforms with end users.

## Architecture

### Level 1: Platform Owner (Tenant)
- Identified by: `tenantId` (extracted from API key)
- Represents: The platform owner who registered on AssetLink
- Access: Can see ALL activity on their platform

### Level 2: End User
- Identified by: `createdBy` / `sellerId` / `buyerId` / `ownerId` (extracted from `X-USER-ID` header)
- Represents: Issuers and investors using the platform
- Access: Can only see their own data

## How It Works

### Example Scenario
1. **Platform Owner** registers on AssetLink → Gets API key
2. **Platform Owner** integrates AssetLink API into their Web3 platform
3. **Issuer** (end user) uses the platform to mint 100 AKP tokens
4. **Issuer** lists 100 AKP tokens on marketplace
5. **Investor 1** buys 10 tokens
6. **Investor 2** buys 15 tokens
7. **Investor 3** buys 50 tokens

### Data Visibility

**Platform Owner Dashboard:**
- Sees ALL custody records (100 AKP tokens)
- Sees ALL listings
- Sees ALL ownerships (Investor 1: 10, Investor 2: 15, Investor 3: 50)
- Sees ALL bids and transactions

**Issuer (via API with X-USER-ID: issuer123):**
- Sees only their custody records (100 AKP tokens they minted)
- Sees only their listings
- Sees bids on their listings
- Cannot see other issuers' data

**Investor 1 (via API with X-USER-ID: investor1):**
- Sees only their ownerships (10 AKP tokens)
- Sees their bids
- Cannot see other investors' portfolios

## API Usage

### Authentication Headers
```
X-API-KEY: pk_abc123...           # Identifies platform (tenantId)
X-SIGNATURE: hmac_signature...    # Request signature
X-TIMESTAMP: 1234567890           # Request timestamp
X-USER-ID: issuer123              # Identifies end user (REQUIRED for most operations)
```

### Endpoints

#### Custody Operations
```bash
# Link asset (requires X-USER-ID)
POST /v1/custody/link
Headers:
  X-API-KEY: pk_abc123
  X-USER-ID: issuer123
Body:
  { "assetId": "asset_001" }

# List custody records
GET /v1/custody
Headers:
  X-API-KEY: pk_abc123
  X-USER-ID: issuer123  # Optional: if provided, filters to this user's assets only

# Without X-USER-ID: Platform owner sees ALL custody records
# With X-USER-ID: End user sees only their own custody records
```

#### Marketplace Operations
```bash
# Create listing (requires X-USER-ID)
POST /v1/marketplace/listings
Headers:
  X-API-KEY: pk_abc123
  X-USER-ID: issuer123
Body:
  {
    "assetId": "asset_001",
    "price": "100.00",
    "currency": "USD",
    "quantity": 100,
    "expiryDate": "2026-12-31T23:59:59Z"
  }

# List all active listings (filtered by tenantId)
GET /v1/marketplace/listings
Headers:
  X-API-KEY: pk_abc123

# Get my listings (requires X-USER-ID)
GET /v1/marketplace/my-listings
Headers:
  X-API-KEY: pk_abc123
  X-USER-ID: issuer123

# Place bid (requires X-USER-ID)
POST /v1/marketplace/listings/:listingId/bids
Headers:
  X-API-KEY: pk_abc123
  X-USER-ID: investor1
Body:
  {
    "amount": "10.00",
    "quantity": 10
  }

# Accept bid (requires X-USER-ID - must be seller)
POST /v1/marketplace/bids/:bidId/accept
Headers:
  X-API-KEY: pk_abc123
  X-USER-ID: issuer123

# Get my portfolio (requires X-USER-ID)
GET /v1/marketplace/my-portfolio
Headers:
  X-API-KEY: pk_abc123
  X-USER-ID: investor1
```

## Database Schema

### CustodyRecord
```prisma
model CustodyRecord {
  id          String   @id @default(cuid())
  assetId     String   @unique
  tenantId    String   // Platform owner
  createdBy   String   // End user who created the asset
  status      String
  // ... other fields
}
```

### Listing
```prisma
model Listing {
  id              String   @id @default(cuid())
  custodyRecordId String
  tenantId        String   // Platform owner
  sellerId        String   // End user who created the listing
  price           Decimal
  quantityListed  Int
  quantitySold    Int      @default(0)
  // ... other fields
}
```

### Bid
```prisma
model Bid {
  id        String   @id @default(cuid())
  listingId String
  tenantId  String   // Platform owner
  buyerId   String   // End user who placed the bid
  amount    Decimal
  quantity  Int
  status    String
  // ... other fields
}
```

### Ownership
```prisma
model Ownership {
  id              String   @id @default(cuid())
  custodyRecordId String
  assetId         String
  tenantId        String   // Platform owner
  ownerId         String   // End user who owns the tokens
  quantity        Int
  purchasePrice   Decimal?
  currency        String?
  acquiredAt      DateTime @default(now())
  // ... other fields
}
```

## Implementation Details

### Middleware (auth.middleware.js)
```javascript
// Extract tenantId from API key
const apiKey = await findByPublicKey(publicKey);
const tenantId = apiKey.tenantId;

// Extract end user ID from header
const endUserId = req.headers['x-user-id'];

// Attach to request
req.auth = {
  tenantId,           // Platform owner
  platformOwnerId: apiKey.userId,
  endUserId,          // End user (optional)
  // ...
};
```

### Controllers
```javascript
// Two-level isolation in action
const tenantId = req.auth?.tenantId;     // Required
const endUserId = req.auth?.endUserId;   // Optional for listing, required for mutations

// Platform owner sees all
if (!endUserId) {
  // Query all records for this tenant
  const records = await findAll({ tenantId });
}

// End user sees only their own
if (endUserId) {
  // Query only this user's records
  const records = await findAll({ tenantId, createdBy: endUserId });
}
```

## Benefits

1. **Multi-Tenant Support**: Multiple platforms can use AssetLink simultaneously
2. **User Privacy**: End users only see their own data
3. **Platform Control**: Platform owners have full visibility
4. **Scalability**: Clean separation of concerns
5. **Security**: Tenant isolation prevents data leakage

## Testing

### Test as Platform Owner
```bash
# See all custody records
curl -X GET http://localhost:3000/v1/custody \
  -H "X-API-KEY: pk_test_platform1" \
  -H "X-SIGNATURE: dummy_signature_for_testing" \
  -H "X-TIMESTAMP: $(date +%s)"
```

### Test as End User (Issuer)
```bash
# See only my custody records
curl -X GET http://localhost:3000/v1/custody \
  -H "X-API-KEY: pk_test_platform1" \
  -H "X-USER-ID: issuer123" \
  -H "X-SIGNATURE: dummy_signature_for_testing" \
  -H "X-TIMESTAMP: $(date +%s)"
```

### Test as End User (Investor)
```bash
# See only my portfolio
curl -X GET http://localhost:3000/v1/marketplace/my-portfolio \
  -H "X-API-KEY: pk_test_platform1" \
  -H "X-USER-ID: investor1" \
  -H "X-SIGNATURE: dummy_signature_for_testing" \
  -H "X-TIMESTAMP: $(date +%s)"
```
