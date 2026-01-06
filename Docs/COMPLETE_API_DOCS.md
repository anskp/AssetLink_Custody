# AssetLink Custody API - Complete Documentation

## Base URL Strategy
Always include the version suffix `/v1` in your API calls:
- **Local Development**: `http://localhost:3000/v1`
- **Production**: `https://api.assetlink.com/v1`

## Authentication

### Required Headers
For HMAC authentication in your other projects:
- `X-API-KEY`: Your public API key (identifies your platform)
- `X-SIGNATURE`: HMAC-SHA256 signature of the request
- `X-TIMESTAMP`: Current unix timestamp (seconds)
- `X-USER-ID`: Required for all create/update/delete operations to identify your end-user.

### Two-Level Isolation
- **Level 1 (Platform)**: X-API-KEY identifies the platform owner (tenant)
- **Level 2 (End User)**: X-USER-ID identifies the end user (issuer/investor)

Platform owners see ALL data. End users see only their own data.

### API Key Roles
- **MAKER**: Create operations (mint, withdraw, burn) - requires checker approval
- **CHECKER**: Approve/reject operations - cannot approve own operations
- **VIEWER**: Read-only access

---

## 1. CUSTODY ENDPOINTS

### 1.1 Link Asset to Custody
**POST** `/v1/custody/link`

Links a real-world asset to custody system.

**Headers:**
```
X-API-KEY: pk_abc123
X-USER-ID: issuer_john
X-SIGNATURE: signature
X-TIMESTAMP: 1704153600
```

**Request Body:**
```json
{
  "assetId": "property_001"
}
```

**Response (201):**
```json
{
  "id": "custody_abc123",
  "assetId": "property_001",
  "tenantId": "tenant_platform1",
  "createdBy": "issuer_john",
  "status": "LINKED",
  "linkedAt": "2026-01-02T12:00:00Z",
  "createdAt": "2026-01-02T12:00:00Z"
}
```

### 1.2 List Custody Records
**GET** `/v1/custody`

**Query Parameters:**
- `status`: LINKED | MINTED | WITHDRAWN | BURNED
- `limit`: number (default: 50)
- `offset`: number (default: 0)

**Without X-USER-ID** (Platform Owner):
```bash
curl -X GET http://localhost:3000/v1/custody \
  -H "X-API-KEY: pk_abc123" \
  -H "X-SIGNATURE: signature" \
  -H "X-TIMESTAMP: 1704153600"
```

**Response:**
```json
{
  "records": [
    {
      "id": "custody_001",
      "assetId": "property_001",
      "tenantId": "tenant_platform1",
      "createdBy": "issuer_john",
      "status": "MINTED",
      "blockchain": "ETHEREUM",
      "tokenAddress": "0x742d35Cc...",
      "tokenId": "1",
      "quantity": "100"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

**With X-USER-ID** (End User):
```bash
curl -X GET http://localhost:3000/v1/custody \
  -H "X-API-KEY: pk_abc123" \
  -H "X-USER-ID: issuer_john" \
  -H "X-SIGNATURE: signature" \
  -H "X-TIMESTAMP: 1704153600"
```

Returns only records where `createdBy === issuer_john`

### 1.3 Get Custody Status
**GET** `/v1/custody/:assetId`

**Response:**
```json
{
  "id": "custody_001",
  "assetId": "property_001",
  "status": "MINTED",
  "blockchain": "ETHEREUM",
  "tokenStandard": "ERC721",
  "tokenAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "tokenId": "1",
  "quantity": "100",
  "linkedAt": "2026-01-01T12:00:00Z",
  "mintedAt": "2026-01-02T12:00:00Z"
}
```

---

## 2. OPERATIONS (Maker-Checker Workflow)

### 2.1 Create Mint Operation (MAKER)
**POST** `/v1/operations/mint`

**Headers:**
```
X-API-KEY: pk_maker_key (MAKER role)
X-USER-ID: issuer_john
X-SIGNATURE: signature
X-TIMESTAMP: 1704153600
```

**Request Body:**
```json
{
  "custodyRecordId": "custody_001",
  "blockchain": "ETHEREUM",
  "tokenStandard": "ERC721",
  "quantity": "100",
  "metadata": {
    "name": "Property Token #1",
    "description": "Tokenized real estate"
  }
}
```

**Response (201):**
```json
{
  "id": "op_mint_001",
  "type": "MINT",
  "status": "PENDING_CHECKER",
  "custodyRecordId": "custody_001",
  "createdBy": "maker_api_key",
  "metadata": {
    "blockchain": "ETHEREUM",
    "tokenStandard": "ERC721",
    "quantity": "100"
  },
  "createdAt": "2026-01-02T12:00:00Z"
}
```

### 2.2 Approve Operation (CHECKER)
**POST** `/v1/operations/:id/approve`

**Headers:**
```
X-API-KEY: pk_checker_key (CHECKER role)
X-USER-ID: checker_alice
X-SIGNATURE: signature
X-TIMESTAMP: 1704153600
```

**Request Body:**
```json
{
  "comment": "Verified and approved"
}
```

**Response (200):**
```json
{
  "id": "op_mint_001",
  "status": "APPROVED",
  "checkedBy": "checker_api_key",
  "checkedAt": "2026-01-02T13:00:00Z",
  "comment": "Verified and approved"
}
```

### 2.3 Reject Operation (CHECKER)
**POST** `/v1/operations/:id/reject`

**Request Body:**
```json
{
  "reason": "Insufficient documentation"
}
```

**Response (200):**
```json
{
  "id": "op_mint_001",
  "status": "REJECTED",
  "checkedBy": "checker_api_key",
  "rejectionReason": "Insufficient documentation",
  "rejectedAt": "2026-01-02T13:00:00Z"
}
```

### 2.4 List Operations
**GET** `/v1/operations`

**Query Parameters:**
- `status`: PENDING_CHECKER | APPROVED | REJECTED | EXECUTED
- `type`: MINT | WITHDRAW | BURN
- `limit`: number
- `offset`: number

**Response:**
```json
{
  "operations": [
    {
      "id": "op_mint_001",
      "type": "MINT",
      "status": "APPROVED",
      "custodyRecordId": "custody_001",
      "createdBy": "maker_api_key",
      "checkedBy": "checker_api_key",
      "createdAt": "2026-01-02T12:00:00Z",
      "checkedAt": "2026-01-02T13:00:00Z"
    }
  ],
  "total": 1
}
```

---

## 3. MARKETPLACE ENDPOINTS

### 3.1 Create Listing
**POST** `/v1/marketplace/listings`

**Headers:**
```
X-API-KEY: pk_abc123
X-USER-ID: issuer_john (seller)
X-SIGNATURE: signature
X-TIMESTAMP: 1704153600
```

**Request Body:**
```json
{
  "assetId": "property_001",
  "price": "100.00",
  "currency": "USD",
  "quantity": 100,
  "expiryDate": "2026-12-31T23:59:59Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "listing_001",
    "custodyRecordId": "custody_001",
    "tenantId": "tenant_platform1",
    "sellerId": "issuer_john",
    "price": "100.00",
    "currency": "USD",
    "quantityListed": 100,
    "quantitySold": 0,
    "status": "ACTIVE",
    "expiryDate": "2026-12-31T23:59:59Z",
    "createdAt": "2026-01-02T12:00:00Z"
  }
}
```

### 3.2 List All Listings
**GET** `/v1/marketplace/listings`

**Query Parameters:**
- `priceMin`: number
- `priceMax`: number
- `sortBy`: price | createdAt
- `sortOrder`: asc | desc

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "listing_001",
      "assetId": "property_001",
      "sellerId": "issuer_john",
      "price": "100.00",
      "currency": "USD",
      "quantityListed": 100,
      "quantitySold": 75,
      "status": "ACTIVE"
    }
  ]
}
```

### 3.3 Place Bid
**POST** `/v1/marketplace/listings/:listingId/bids`

**Headers:**
```
X-API-KEY: pk_abc123
X-USER-ID: investor_alice (buyer)
X-SIGNATURE: signature
X-TIMESTAMP: 1704153600
```

**Request Body:**
```json
{
  "amount": "10.00",
  "quantity": 10
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "bid_001",
    "listingId": "listing_001",
    "tenantId": "tenant_platform1",
    "buyerId": "investor_alice",
    "amount": "10.00",
    "quantity": 10,
    "status": "PENDING",
    "createdAt": "2026-01-02T14:00:00Z"
  }
}
```

### 3.4 Accept Bid
**POST** `/v1/marketplace/bids/:bidId/accept`

**Headers:**
```
X-API-KEY: pk_abc123
X-USER-ID: issuer_john (seller - must match listing seller)
X-SIGNATURE: signature
X-TIMESTAMP: 1704153600
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bid": {
      "id": "bid_001",
      "status": "ACCEPTED",
      "acceptedAt": "2026-01-02T15:00:00Z"
    },
    "ownership": {
      "id": "ownership_001",
      "custodyRecordId": "custody_001",
      "assetId": "property_001",
      "tenantId": "tenant_platform1",
      "ownerId": "investor_alice",
      "quantity": 10,
      "purchasePrice": "10.00",
      "currency": "USD",
      "acquiredAt": "2026-01-02T15:00:00Z"
    }
  }
}
```

### 3.5 Get My Listings
**GET** `/v1/marketplace/my-listings`

**Headers:**
```
X-API-KEY: pk_abc123
X-USER-ID: issuer_john
X-SIGNATURE: signature
X-TIMESTAMP: 1704153600
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "listing_001",
      "assetId": "property_001",
      "price": "100.00",
      "quantityListed": 100,
      "quantitySold": 75,
      "status": "ACTIVE",
      "bids": [
        {
          "id": "bid_001",
          "buyerId": "investor_alice",
          "amount": "10.00",
          "quantity": 10,
          "status": "ACCEPTED"
        }
      ]
    }
  ]
}
```

### 3.6 Get My Portfolio
**GET** `/v1/marketplace/my-portfolio`

**Headers:**
```
X-API-KEY: pk_abc123
X-USER-ID: investor_alice
X-SIGNATURE: signature
X-TIMESTAMP: 1704153600
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ownership_001",
      "assetId": "property_001",
      "ownerId": "investor_alice",
      "quantity": 10,
      "purchasePrice": "10.00",
      "currency": "USD",
      "acquiredAt": "2026-01-02T15:00:00Z"
    }
  ]
}
```

---

## 4. COMPLETE WORKFLOW EXAMPLE

### Step 1: Platform Owner Registers & Gets API Key
```bash
# Register on dashboard
POST http://localhost:5173/register
# Generate API key with MAKER role
# Get: pk_maker_abc123 / sk_maker_secret
```

### Step 2: Issuer Links Asset
```bash
curl -X POST http://localhost:3000/v1/custody/link \
  -H "X-API-KEY: pk_maker_abc123" \
  -H "X-USER-ID: issuer_john" \
  -H "X-SIGNATURE: dummy_signature_for_testing" \
  -H "X-TIMESTAMP: $(date +%s)" \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "property_001"
  }'
```

### Step 3: Issuer Creates Mint Operation
```bash
curl -X POST http://localhost:3000/v1/operations/mint \
  -H "X-API-KEY: pk_maker_abc123" \
  -H "X-USER-ID: issuer_john" \
  -H "X-SIGNATURE: dummy_signature_for_testing" \
  -H "X-TIMESTAMP: $(date +%s)" \
  -H "Content-Type: application/json" \
  -d '{
    "custodyRecordId": "custody_001",
    "blockchain": "ETHEREUM",
    "tokenStandard": "ERC721",
    "quantity": "100"
  }'
```

### Step 4: Checker Approves Operation
```bash
curl -X POST http://localhost:3000/v1/operations/op_mint_001/approve \
  -H "X-API-KEY: pk_checker_xyz789" \
  -H "X-USER-ID: checker_alice" \
  -H "X-SIGNATURE: dummy_signature_for_testing" \
  -H "X-TIMESTAMP: $(date +%s)" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Approved"
  }'
```

### Step 5: Issuer Lists Tokens on Marketplace
```bash
curl -X POST http://localhost:3000/v1/marketplace/listings \
  -H "X-API-KEY: pk_maker_abc123" \
  -H "X-USER-ID: issuer_john" \
  -H "X-SIGNATURE: dummy_signature_for_testing" \
  -H "X-TIMESTAMP: $(date +%s)" \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "property_001",
    "price": "100.00",
    "currency": "USD",
    "quantity": 100,
    "expiryDate": "2026-12-31T23:59:59Z"
  }'
```

### Step 6: Investor Places Bid
```bash
curl -X POST http://localhost:3000/v1/marketplace/listings/listing_001/bids \
  -H "X-API-KEY: pk_maker_abc123" \
  -H "X-USER-ID: investor_alice" \
  -H "X-SIGNATURE: dummy_signature_for_testing" \
  -H "X-TIMESTAMP: $(date +%s)" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "10.00",
    "quantity": 10
  }'
```

### Step 7: Issuer Accepts Bid
```bash
curl -X POST http://localhost:3000/v1/marketplace/bids/bid_001/accept \
  -H "X-API-KEY: pk_maker_abc123" \
  -H "X-USER-ID: issuer_john" \
  -H "X-SIGNATURE: dummy_signature_for_testing" \
  -H "X-TIMESTAMP: $(date +%s)"
```

### Step 8: Investor Views Portfolio
```bash
curl -X GET http://localhost:3000/v1/marketplace/my-portfolio \
  -H "X-API-KEY: pk_maker_abc123" \
  -H "X-USER-ID: investor_alice" \
  -H "X-SIGNATURE: dummy_signature_for_testing" \
  -H "X-TIMESTAMP: $(date +%s)"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "details": [
      {
        "field": "assetId",
        "message": "Required field"
      }
    ]
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "message": "Invalid API key",
    "statusCode": 401
  }
}
```

### 403 Forbidden
```json
{
  "error": {
    "message": "You do not have access to this resource",
    "statusCode": 403
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "message": "Asset not found in custody",
    "statusCode": 404
  }
}
```

## 5. LOCAL DEVELOPMENT GUIDE

When connecting your other backend (e.g., port 5000) to AssetLink (port 3000):

1. **Base URL**: `http://localhost:3000/v1`
2. **Signature Path**: Must include `/v1`. E.g., `/v1/custody/link`
3. **Connectivity**: Since both run on `localhost`, they can communicate directly. No special server setup is needed.
4. **CORS**: Only required if your frontend app (browser) is talking directly to the API.

---

## Support
- Documentation: http://localhost:3000/dashboard (Interface)
- OpenAPI Spec: http://localhost:3000/v1/docs/openapi.yaml
- Email: support@assetlink.com
