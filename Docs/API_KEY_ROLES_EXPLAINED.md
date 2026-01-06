# API Key Roles - Complete Explanation

## The Story: RealEstateShare.com Uses AssetLink

### Step 1: Platform Registration
```
RealEstateShare.com registers on AssetLink Dashboard
↓
Gets login credentials
↓
Logs into AssetLink Client Dashboard
```

### Step 2: Generate API Keys (2 Different Keys Needed)

```
┌─────────────────────────────────────────────────────────────┐
│ AssetLink Dashboard - API Keys Page                         │
│                                                              │
│ [Generate New Key] Button                                   │
│                                                              │
│ Creates:                                                     │
│ 1. MAKER Key   → pk_maker_abc123 / sk_maker_secret         │
│ 2. CHECKER Key → pk_checker_xyz789 / sk_checker_secret     │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: RealEstateShare.com Backend Integration

```
┌──────────────────────────────────────────────────────────────┐
│ RealEstateShare.com Backend                                  │
│                                                               │
│ Stores both API keys:                                        │
│ - MAKER_API_KEY = pk_maker_abc123 / sk_maker_secret         │
│ - CHECKER_API_KEY = pk_checker_xyz789 / sk_checker_secret   │
└──────────────────────────────────────────────────────────────┘
```

## The 3 Roles on RealEstateShare.com

### Role 1: ISSUER (John) - Uses MAKER Key
```
Issuer John logs into RealEstateShare.com
↓
Wants to tokenize his property
↓
RealEstateShare.com Backend makes API call:

POST http://assetlink.com/v1/custody/link
Headers:
  X-API-KEY: pk_maker_abc123
  X-SIGNATURE: hmac(sk_maker_secret, request)
  X-USER-ID: issuer_john
Body:
  { "assetId": "property_001" }

↓
Asset linked, status: PENDING_APPROVAL
```

### Role 2: ADMIN (Alice) - Uses CHECKER Key
```
Admin Alice logs into RealEstateShare.com Admin Panel
↓
Sees pending asset approval
↓
Reviews property documents
↓
RealEstateShare.com Backend makes API call:

POST http://assetlink.com/v1/operations/approve
Headers:
  X-API-KEY: pk_checker_xyz789
  X-SIGNATURE: hmac(sk_checker_secret, request)
  X-USER-ID: admin_alice
Body:
  { "operationId": "op_001" }

↓
Asset approved and minted!
```

### Role 3: INVESTOR (Bob) - Uses MAKER Key
```
Investor Bob logs into RealEstateShare.com
↓
Browses marketplace
↓
Wants to buy tokens
↓
RealEstateShare.com Backend makes API call:

POST http://assetlink.com/v1/marketplace/listings/123/bids
Headers:
  X-API-KEY: pk_maker_abc123
  X-SIGNATURE: hmac(sk_maker_secret, request)
  X-USER-ID: investor_bob
Body:
  { "amount": "100", "quantity": 10 }

↓
Bid placed!
```

## Why 2 Different API Keys?

### MAKER Key (pk_maker_abc123)
**Used by:** Issuers & Investors
**Can do:**
- Link assets to custody
- Create mint operations
- Create marketplace listings
- Place bids
- View data

**Cannot do:**
- Approve operations (needs CHECKER)

### CHECKER Key (pk_checker_xyz789)
**Used by:** Admins/Compliance Officers
**Can do:**
- Approve operations
- Reject operations
- View data

**Cannot do:**
- Create operations
- Approve own operations (separation of duties)

## The Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ RealEstateShare.com Platform                                │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Integrates with
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ AssetLink API                                               │
│                                                             │
│ Tenant: RealEstateShare.com                                │
│ API Keys:                                                   │
│   - MAKER Key (for issuers/investors)                      │
│   - CHECKER Key (for admins)                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Tracks users via X-USER-ID
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ End Users (identified by X-USER-ID):                       │
│                                                             │
│ issuer_john    → Uses MAKER key to link assets            │
│ admin_alice    → Uses CHECKER key to approve              │
│ investor_bob   → Uses MAKER key to buy tokens             │
│ investor_carol → Uses MAKER key to buy tokens             │
└─────────────────────────────────────────────────────────────┘
```

## Key Points

1. **One Platform = Multiple API Keys**
   - RealEstateShare.com needs at least 2 keys (MAKER + CHECKER)
   - Could create multiple MAKER keys for different purposes

2. **X-USER-ID Identifies End Users**
   - Same API key used by multiple end users
   - X-USER-ID header distinguishes them
   - Each user only sees their own data

3. **Maker-Checker Separation**
   - Issuer creates operation (MAKER key)
   - Admin approves operation (CHECKER key)
   - Same person cannot do both (security)

4. **Platform Owner Dashboard**
   - RealEstateShare.com sees ALL activity
   - All issuers, all investors, all transactions
   - Complete platform overview

5. **End User API Access**
   - Each end user only sees their own data
   - issuer_john sees only his assets
   - investor_bob sees only his portfolio
