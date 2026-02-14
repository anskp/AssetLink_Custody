# RWA Tokenization Integration Guide

This guide explains how to integrate with the AssetLink Custody API to tokenize Real-World Assets (RWA) using the automated orchestration engine (ERC20F + Oracles).

## Orchestration Flow

1. **Link Asset (Maker)**: Submit asset details including initial NAV/PoR.
2. **Approve Link (Checker)**: Approve the link to trigger automated deployment.
3. **Automated Deployment**: System creates Vaults, deploys Oracles, and deploys the Token Proxy.
4. **Minting**: Once orchestration is complete, tokens can be minted via the Lifecycle API.
5. **Oracle Updates**: Update NAV/PoR values periodically as verified.

---

## 1. Link Asset (Maker)
**Endpoint**: `POST /v1/custody/link`

Create a pending custody record. This stores the initial metadata and desired oracle values.

**Request Body:**
```json
{
  "assetId": "PROP-DUBAI-001",
  "assetName": "Burj Residence #101",
  "initialNav": "500.00",
  "initialPor": "1000.00",
  "customFields": {
    "symbol": "BR101",
    "location": "Dubai, UAE"
  }
}
```

---

## 2. Approve & Orchestrate (Checker)
**Endpoint**: `POST /v1/custody/:id/approve`

This endpoint must be called by a different API key (Checker role). It triggers the **Background Orchestration**:
- Creates Fireblocks Vault & Wallet.
- Deploys **NAV Oracle** (8 decimals).
- Deploys **PoR Oracle** (18 decimals).
- Deploys **ERC20F Token Proxy** linked to both oracles.

**Response:**
```json
{
  "id": "uuid",
  "status": "PENDING",
  "message": "Orchestration initiated"
}
```

---

## 3. Monitoring Progress
**Endpoint**: `GET /v1/custody/:assetId`

Poll this endpoint to check progress. 

**Terminal States:**
- `LINKED`: Orchestration successful. `tokenAddress` and `navOracleAddress` will be populated.
- `FAILED`: Orchestration failed. Check `errorMessage` for details.

---

## 4. Minting Tokens
**Endpoint**: `POST /v1/token-lifecycle/mint`

Once status is `LINKED`, you can mint tokens. For `ERC20F` tokens, the system uses a custom `CONTRACT_CALL` to the proxy's `mint()` function.

**Request Body:**
```json
{
  "assetId": "PROP-DUBAI-001",
  "tokenSymbol": "BR101",
  "tokenName": "Burj Residence #101",
  "totalSupply": "1000",
  "decimals": 18,
  "blockchainId": "ETH_TEST5"
}
```

---

## 5. Updating Oracles
**Endpoint**: `POST /v1/custody/:id/oracle`

Update the value of the NAV or PoR oracle.

**Request Body:**
```json
{
  "type": "NAV",
  "value": "510.25"
}
```

---

## Authentication Checklist
All requests must include:
- `x-api-key`: Your Public Key.
- `x-signature`: HMAC-SHA256 signature.
- `x-timestamp`: Unix timestamp (seconds).
- `x-user-id`: End-user identifier for two-level isolation.

**Signature Payload**: `METHOD + PATH + TIMESTAMP + BODY_STRING`
