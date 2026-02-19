# RWA Tokenization Integration Guide

This guide explains how to integrate with the AssetLink Custody API to tokenize Real-World Assets (RWA) using the automated orchestration engine (ERC20F + Oracles).

## 🚀 Orchestration Architecture (JIT)

AssetLink uses a **Just-In-Time (JIT) Deployment** strategy. Instead of pre-deploying tokens, the entire stack is provisioned when the first minting operation is approved.

### 📜 The Token Stack
1. **NAV Oracle**: A generic RWA Oracle for Net Asset Value.
2. **PoR Oracle**: A generic RWA Oracle for Proof of Reserve.
3. **Token Proxy**: A Universal Upgradeable Proxy (UUPS) pointing to the `UniqueAssetToken` (ERC20F) implementation.

## ✨ Technical Refinements
- **Fireblocks Web3 Provider**: Deployment and contract interactions are handled via the `@fireblocks/fireblocks-web3-provider` for seamless Ethers.js integration.
- **Transaction API Monitoring**: Custom `ERC20F` tokens are monitored via the Fireblocks Transaction API (`/v1/transactions`) instead of the Tokenization API. This provides better control over custom contract deployments.
- **Checksum Integrity**: All blockchain addresses are normalized using **EIP-55 Checksums** to ensure consistency and prevent "bad address" errors.

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

This endpoint triggers the **JIT Orchestration**:
- Creates Fireblocks Vault & Wallet.
- Deploys **NAV Oracle** (8 decimals).
- Deploys **PoR Oracle** (18 decimals).
- Deploys **UUPS Token Proxy** (encoded with full `initialize` signature).

---

## 3. Monitoring Progress
**Endpoint**: `GET /v1/custody/:assetId` or Check **Audit Logs**

The system now captures every internal transaction hash:
- `navOracleTxHash`
- `porOracleTxHash`
- `tokenProxyTxHash`
- `mintTxHash`

---

## 4. Minting Tokens
**Endpoint**: `POST /v1/token-lifecycle/mint`

For `ERC20F` tokens, the system uses a **Standard Transaction Mode**:
1. Initiates a `CONTRACT_CALL`.
2. Receives a `txId` from Fireblocks.
3. Polling moves to `/v1/transactions/{id}` to verify on-chain finality.
4. Once `COMPLETED`, status moves to `MINTED`.

---

## 5. Persistence & Traceability
The database now stores full on-chain evidence for every RWA token, allowing for absolute transparency and auditability of the tokenization process from the first oracle deployment to the final mint.

---

## Authentication Checklist
All requests require:
- `x-api-key`: Your Public Key.
- `x-signature`: HMAC-SHA256 signature.
- `x-timestamp`: Unix timestamp (seconds).
- `x-user-id`: End-user identifier for two-level isolation.

