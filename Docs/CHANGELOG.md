# Changelog

All notable changes to AssetLink Custody will be documented in this file.

## [1.1.0] - 2026-01-02

### 🎉 Added - Two-Level Isolation System

#### Database Schema
- Added `tenantId` field to CustodyRecord, Listing, Bid, and Ownership models
- Added `createdBy` field to CustodyRecord (identifies end user who created asset)
- Added `sellerId` field to Listing (identifies end user who listed)
- Added `buyerId` field to Bid (identifies end user who placed bid)
- Added `ownerId` field to Ownership (identifies end user who owns tokens)
- Added `quantityListed` and `quantitySold` to Listing for partial sales
- Added `quantity` to Bid for partial purchases
- Added `purchasePrice` and `currency` to Ownership for tracking

#### Authentication & Middleware
- Enhanced `auth.middleware.js` to extract `X-USER-ID` header
- Added `endUserId` to `req.auth` context
- Added `platformOwnerId` to distinguish platform owner from end users
- Maintained backward compatibility with existing JWT authentication

#### Custody Module
- Updated `custody.controller.js` to use two-level isolation
- Updated `custody.service.js` to filter by `tenantId` and optionally `createdBy`
- Updated `custody.repository.js` to support new schema fields
- `linkAsset()` now requires `X-USER-ID` header
- `listCustodyRecords()` filters by end user when `X-USER-ID` provided

#### Marketplace Module
- Completely rewrote `marketplace.controller.js` with two-level isolation
- Added `GET /v1/marketplace/my-listings` endpoint
- Added `GET /v1/marketplace/my-portfolio` endpoint
- Updated all endpoints to require `X-USER-ID` for mutations
- Updated `marketplace.routes.js` with new endpoints

#### Documentation
- Created `TWO_LEVEL_ISOLATION_GUIDE.md` - Complete implementation guide
- Created `IMPLEMENTATION_SUMMARY.md` - What was built and how it works
- Created `QUICK_REFERENCE.md` - Quick reference for developers
- Created `CHANGELOG.md` - This file
- Updated `MARKETPLACE_FLOW.md` with implementation status
- Updated `README.md` with two-level isolation overview
- Updated `openapi.yaml` with `X-USER-ID` header documentation

#### Testing
- Created `scripts/test-two-level-isolation.js` - Test script for isolation

### 🔧 Changed

#### Breaking Changes
- CustodyRecord no longer has direct `userId` foreign key
- Listing no longer has direct User relation
- Bid no longer has direct User relation
- Ownership no longer has direct User relation
- All marketplace operations now require `X-USER-ID` header

#### Non-Breaking Changes
- JWT authentication still works for dashboard access
- Admin endpoints unchanged
- Audit logging enhanced with tenant context

### 📝 Migration Notes

If upgrading from v1.0.0:

1. **Database Migration Required**
   ```bash
   cd Assetlink
   npx prisma migrate dev --name add_two_level_isolation
   npx prisma generate
   ```

2. **API Changes**
   - Add `X-USER-ID` header to all custody and marketplace API calls
   - Platform owners can omit `X-USER-ID` to see all data
   - End users must provide `X-USER-ID` to see only their data

3. **Code Changes**
   - Update API clients to include `X-USER-ID` header
   - Update frontend to pass end user identifier

### 🐛 Fixed
- None (new feature release)

### 🔒 Security
- Enhanced tenant isolation prevents cross-tenant data access
- End user isolation prevents users from seeing each other's data
- All operations logged with tenant and user context for audit

---

## [1.0.0] - 2025-12-XX

### Initial Release
- JWT authentication for dashboard users
- API key authentication with HMAC signatures
- Custody record management
- Fireblocks integration
- Vault management
- Token lifecycle operations (mint, withdraw, burn)
- Maker-checker workflow
- Audit logging
- Admin dashboard
- Client dashboard
- API documentation page
- OpenAPI specification

---

## Version Format

This project follows [Semantic Versioning](https://semver.org/):
- MAJOR version for incompatible API changes
- MINOR version for new functionality in a backward compatible manner
- PATCH version for backward compatible bug fixes

## Categories

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
