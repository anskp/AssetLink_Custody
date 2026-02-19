# Sprint 6 Guide: RWA Tokenization & JIT Orchestration

## Overview
Sprint 6 focused on implementing a robust, traceable, and compliant Real-World Asset (RWA) tokenization flow. We introduced **Just-In-Time (JIT) Orchestration**, which automates the deployment of oracles and token proxies upon approval.

## Key Transitions
### From Tokenization Engine to Transaction API
We migrated from the opaque Fireblocks Tokenization Engine to the more flexible **Fireblocks Transaction API**.
- **Reason**: Custom `ERC20F` tokens require specific initialization and contract interaction that the native Tokenization Engine couldn't support with our multi-oracle architecture.
- **Monitoring**: Minting is now monitored via `/v1/transactions`, providing granular status updates on on-chain finality.

## Core Advancements

### 1. JIT Orchestration Stack
When an asset link is approved, the system automatically deploys:
1. **RWA Oracles**: Two instances of `RWA_Oracle.sol` for NAV and PoR.
2. **Token Proxy**: A `FireblocksProxy.sol` (UUPS) pointing to the `UniqueAssetToken` implementation.
3. **Checksum Enforcement**: All addresses are normalized to EIP-55 to ensure deployment reliability.

### 2. Traceability & Persistence
Every step of the on-chain deployment is now recorded in the database:
- **NAV Oracle**: Address + Deploy TX Hash
- **PoR Oracle**: Address + Deploy TX Hash
- **Token Proxy**: Address + Deploy TX Hash
- **Initial Mint**: Mint TX Hash + Fireblocks Task ID

### 3. Fireblocks Web3 Provider
We integrated the `@fireblocks/fireblocks-web3-provider` to allow **Ethers.js v6** to sign transactions directly via Fireblocks. This allowed us to:
- Use standard Ethers `ContractFactory` and `Contract` objects.
- Encode initialization data with full function signatures.
- Handle complex constructor arguments seamlessly.

## Configuration Updates
- New environment variable `UAT_IMPLEMENTATION_ADDRESS` specifies the logic contract for all proxies.
- Checksums are automatically applied during initialization.

## Status Management
- **NEW STATUS**: `MINTED` - Successfully confirmed on-chain.
- **Improved Polling**: Polling now handles potential race conditions between transaction submission and finality indexing.

## Security Controls
- **Full Traceability**: On-chain evidence for every contract in the stack.
- **Separation of Concerns**: Oracles are decoupled from token logic, allowing for independent price/reserve updates.
