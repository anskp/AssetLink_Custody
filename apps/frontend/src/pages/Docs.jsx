import { useState } from 'react';
import DocsLayout from '../components/DocsLayout';

export default function Docs() {
  const [activeSection, setActiveSection] = useState('introduction');

  const renderContent = () => {
    switch (activeSection) {
      case 'introduction':
        return <IntroductionSection />;
      case 'authentication':
        return <AuthenticationSection />;
      case 'custody':
        return <CustodySection />;
      case 'operations':
        return <OperationsSection />;
      case 'marketplace':
        return <MarketplaceSection />;
      case 'workflow':
        return <WorkflowSection />;
      case 'errors':
        return <ErrorsSection />;
      case 'openapi':
        return <OpenAPISection />;
      default:
        return <IntroductionSection />;
    }
  };

  return (
    <DocsLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {/* Header */}
      <header className="border-b border-white p-8 text-center">
        <h1 className="text-4xl font-bold uppercase mb-2">
          AssetLink API Documentation
        </h1>
        <p className="text-base text-white/70">
          Secure Custody Infrastructure for Tokenized Real-World Assets
        </p>
        <div className="mt-4 font-mono text-sm">
          BASE URL: <span className="text-green-500">http://localhost:3000/v1</span>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-8">
        {renderContent()}
      </div>
    </DocsLayout>
  );
}

// Introduction Section
function IntroductionSection() {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold uppercase mb-6 border-b border-white pb-2">
        Introduction
      </h2>
      <p className="leading-relaxed mb-4">
        AssetLink Custody is a custody-only backend system designed to securely manage blockchain tokens
        that represent verified real-world assets. Built on Fireblocks MPC-CMP infrastructure.
      </p>
      <div className="border border-white p-4 mb-4">
        <h3 className="font-bold mb-2">KEY FEATURES</h3>
        <ul className="list-none p-0">
          <li>→ Two-Level Isolation (Platform + End User)</li>
          <li>→ Maker-Checker Workflow</li>
          <li>→ Off-Chain Ownership Ledger</li>
          <li>→ Marketplace Trading</li>
          <li>→ HMAC-SHA256 Authentication</li>
        </ul>
      </div>
    </section>
  );
}

// Authentication Section
function AuthenticationSection() {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold uppercase mb-6 border-b border-white pb-2">
        Authentication
      </h2>
      <h3 className="font-bold mb-4">REQUIRED HEADERS</h3>
      <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`X-API-KEY: your_public_key
X-SIGNATURE: hmac_sha256_signature
X-TIMESTAMP: unix_timestamp
X-USER-ID: end_user_identifier (optional for read, required for write)`}
      </pre>

      <h3 className="font-bold mb-4">TWO-LEVEL ISOLATION</h3>
      <div className="border border-white p-4 mb-4">
        <p className="mb-2">
          <strong>Level 1 (Platform):</strong> X-API-KEY identifies tenant. Platform owners see ALL data.
        </p>
        <p>
          <strong>Level 2 (End User):</strong> X-USER-ID identifies issuer/investor. See only their own data.
        </p>
      </div>

      <h3 className="font-bold mb-4">API KEY ROLES</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="border border-white p-4">
          <div className="font-bold mb-2">MAKER</div>
          <div className="text-sm">Create operations (mint, withdraw, burn)</div>
        </div>
        <div className="border border-white p-4">
          <div className="font-bold mb-2">CHECKER</div>
          <div className="text-sm">Approve/reject operations</div>
        </div>
        <div className="border border-white p-4">
          <div className="font-bold mb-2">VIEWER</div>
          <div className="text-sm">Read-only access</div>
        </div>
      </div>
    </section>
  );
}


// Custody Section
function CustodySection() {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold uppercase mb-6 border-b border-white pb-2">
        1. Custody Endpoints
      </h2>

      {/* POST /custody/link */}
      <div className="mb-8 border border-white p-6">
        <div className="mb-4">
          <span className="bg-green-500 text-black px-2 py-1 font-bold mr-2">POST</span>
          <code className="font-mono">/v1/custody/link</code>
        </div>
        <p className="mb-4 text-white/80">Link a real-world asset to custody system</p>
        
        <h4 className="font-bold mb-2">REQUEST</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`curl -X POST http://localhost:3000/v1/custody/link \\
  -H "X-API-KEY: pk_abc123" \\
  -H "X-USER-ID: issuer_john" \\
  -H "X-SIGNATURE: dummy_signature_for_testing" \\
  -H "X-TIMESTAMP: $(date +%s)" \\
  -H "Content-Type: application/json" \\
  -d '{
    "assetId": "property_001"
  }'`}
        </pre>

        <h4 className="font-bold mb-2">RESPONSE (201)</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`{
  "id": "custody_abc123",
  "assetId": "property_001",
  "tenantId": "tenant_platform1",
  "createdBy": "issuer_john",
  "status": "LINKED",
  "linkedAt": "2026-01-02T12:00:00Z"
}`}
        </pre>
      </div>

      {/* GET /custody */}
      <div className="mb-8 border border-white p-6">
        <div className="mb-4">
          <span className="bg-blue-500 text-black px-2 py-1 font-bold mr-2">GET</span>
          <code className="font-mono">/v1/custody</code>
        </div>
        <p className="mb-4 text-white/80">List custody records (filtered by tenant and optionally by user)</p>
        
        <h4 className="font-bold mb-2">REQUEST (Platform Owner - sees ALL)</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`curl -X GET http://localhost:3000/v1/custody \\
  -H "X-API-KEY: pk_abc123" \\
  -H "X-SIGNATURE: dummy_signature_for_testing" \\
  -H "X-TIMESTAMP: $(date +%s)"`}
        </pre>

        <h4 className="font-bold mb-2">REQUEST (End User - sees only their own)</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`curl -X GET http://localhost:3000/v1/custody \\
  -H "X-API-KEY: pk_abc123" \\
  -H "X-USER-ID: issuer_john" \\
  -H "X-SIGNATURE: dummy_signature_for_testing" \\
  -H "X-TIMESTAMP: $(date +%s)"`}
        </pre>

        <h4 className="font-bold mb-2">RESPONSE (200)</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`{
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
}`}
        </pre>
      </div>

      {/* GET /custody/:assetId */}
      <div className="mb-8 border border-white p-6">
        <div className="mb-4">
          <span className="bg-blue-500 text-black px-2 py-1 font-bold mr-2">GET</span>
          <code className="font-mono">/v1/custody/:assetId</code>
        </div>
        <p className="mb-4 text-white/80">Get custody status for specific asset</p>
        
        <h4 className="font-bold mb-2">RESPONSE (200)</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`{
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
}`}
        </pre>
      </div>
    </section>
  );
}


// Operations Section
function OperationsSection() {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold uppercase mb-6 border-b border-white pb-2">
        2. Operations (Maker-Checker Workflow)
      </h2>

      {/* POST /operations/mint */}
      <div className="mb-8 border border-white p-6">
        <div className="mb-4">
          <span className="bg-green-500 text-black px-2 py-1 font-bold mr-2">POST</span>
          <code className="font-mono">/v1/operations/mint</code>
        </div>
        <p className="mb-4 text-white/80">Create mint operation (MAKER role required)</p>
        
        <h4 className="font-bold mb-2">REQUEST</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`curl -X POST http://localhost:3000/v1/operations/mint \\
  -H "X-API-KEY: pk_maker_key" \\
  -H "X-USER-ID: issuer_john" \\
  -H "X-SIGNATURE: dummy_signature_for_testing" \\
  -H "X-TIMESTAMP: $(date +%s)" \\
  -H "Content-Type: application/json" \\
  -d '{
    "custodyRecordId": "custody_001",
    "blockchain": "ETHEREUM",
    "tokenStandard": "ERC721",
    "quantity": "100"
  }'`}
        </pre>

        <h4 className="font-bold mb-2">RESPONSE (201)</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`{
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
}`}
        </pre>
      </div>

      {/* POST /operations/:id/approve */}
      <div className="mb-8 border border-white p-6">
        <div className="mb-4">
          <span className="bg-green-500 text-black px-2 py-1 font-bold mr-2">POST</span>
          <code className="font-mono">/v1/operations/:id/approve</code>
        </div>
        <p className="mb-4 text-white/80">Approve operation (CHECKER role required)</p>
        
        <h4 className="font-bold mb-2">REQUEST</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`curl -X POST http://localhost:3000/v1/operations/op_mint_001/approve \\
  -H "X-API-KEY: pk_checker_key" \\
  -H "X-USER-ID: checker_alice" \\
  -H "X-SIGNATURE: dummy_signature_for_testing" \\
  -H "X-TIMESTAMP: $(date +%s)" \\
  -H "Content-Type: application/json" \\
  -d '{
    "comment": "Verified and approved"
  }'`}
        </pre>

        <h4 className="font-bold mb-2">RESPONSE (200)</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`{
  "id": "op_mint_001",
  "status": "APPROVED",
  "checkedBy": "checker_api_key",
  "checkedAt": "2026-01-02T13:00:00Z",
  "comment": "Verified and approved"
}`}
        </pre>
      </div>

      {/* POST /operations/:id/reject */}
      <div className="mb-8 border border-white p-6">
        <div className="mb-4">
          <span className="bg-green-500 text-black px-2 py-1 font-bold mr-2">POST</span>
          <code className="font-mono">/v1/operations/:id/reject</code>
        </div>
        <p className="mb-4 text-white/80">Reject operation (CHECKER role required)</p>
        
        <h4 className="font-bold mb-2">REQUEST</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`curl -X POST http://localhost:3000/v1/operations/op_mint_001/reject \\
  -H "X-API-KEY: pk_checker_key" \\
  -H "X-USER-ID: checker_alice" \\
  -H "X-SIGNATURE: dummy_signature_for_testing" \\
  -H "X-TIMESTAMP: $(date +%s)" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reason": "Insufficient documentation"
  }'`}
        </pre>

        <h4 className="font-bold mb-2">RESPONSE (200)</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`{
  "id": "op_mint_001",
  "status": "REJECTED",
  "checkedBy": "checker_api_key",
  "rejectionReason": "Insufficient documentation",
  "rejectedAt": "2026-01-02T13:00:00Z"
}`}
        </pre>
      </div>

      {/* GET /operations */}
      <div className="mb-8 border border-white p-6">
        <div className="mb-4">
          <span className="bg-blue-500 text-black px-2 py-1 font-bold mr-2">GET</span>
          <code className="font-mono">/v1/operations</code>
        </div>
        <p className="mb-4 text-white/80">List all operations with filters</p>
        
        <h4 className="font-bold mb-2">QUERY PARAMETERS</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`status: PENDING_CHECKER | APPROVED | REJECTED | EXECUTED
type: MINT | WITHDRAW | BURN
limit: number
offset: number`}
        </pre>

        <h4 className="font-bold mb-2">RESPONSE (200)</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`{
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
}`}
        </pre>
      </div>
    </section>
  );
}


// Marketplace Section
function MarketplaceSection() {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold uppercase mb-6 border-b border-white pb-2">
        3. Marketplace Endpoints
      </h2>

      {/* POST /marketplace/listings */}
      <div className="mb-8 border border-white p-6">
        <div className="mb-4">
          <span className="bg-green-500 text-black px-2 py-1 font-bold mr-2">POST</span>
          <code className="font-mono">/v1/marketplace/listings</code>
        </div>
        <p className="mb-4 text-white/80">Create a new marketplace listing</p>
        
        <h4 className="font-bold mb-2">REQUEST</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`curl -X POST http://localhost:3000/v1/marketplace/listings \\
  -H "X-API-KEY: pk_abc123" \\
  -H "X-USER-ID: issuer_john" \\
  -H "X-SIGNATURE: dummy_signature_for_testing" \\
  -H "X-TIMESTAMP: $(date +%s)" \\
  -H "Content-Type: application/json" \\
  -d '{
    "assetId": "property_001",
    "price": "100.00",
    "currency": "USD",
    "quantity": 100,
    "expiryDate": "2026-12-31T23:59:59Z"
  }'`}
        </pre>

        <h4 className="font-bold mb-2">RESPONSE (201)</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`{
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
}`}
        </pre>
      </div>

      {/* GET /marketplace/listings */}
      <div className="mb-8 border border-white p-6">
        <div className="mb-4">
          <span className="bg-blue-500 text-black px-2 py-1 font-bold mr-2">GET</span>
          <code className="font-mono">/v1/marketplace/listings</code>
        </div>
        <p className="mb-4 text-white/80">List all active listings</p>
        
        <h4 className="font-bold mb-2">QUERY PARAMETERS</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`priceMin: number
priceMax: number
sortBy: price | createdAt
sortOrder: asc | desc`}
        </pre>

        <h4 className="font-bold mb-2">RESPONSE (200)</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`{
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
}`}
        </pre>
      </div>

      {/* POST /marketplace/listings/:listingId/bids */}
      <div className="mb-8 border border-white p-6">
        <div className="mb-4">
          <span className="bg-green-500 text-black px-2 py-1 font-bold mr-2">POST</span>
          <code className="font-mono">/v1/marketplace/listings/:listingId/bids</code>
        </div>
        <p className="mb-4 text-white/80">Place a bid on a listing</p>
        
        <h4 className="font-bold mb-2">REQUEST</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`curl -X POST http://localhost:3000/v1/marketplace/listings/listing_001/bids \\
  -H "X-API-KEY: pk_abc123" \\
  -H "X-USER-ID: investor_alice" \\
  -H "X-SIGNATURE: dummy_signature_for_testing" \\
  -H "X-TIMESTAMP: $(date +%s)" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": "10.00",
    "quantity": 10
  }'`}
        </pre>

        <h4 className="font-bold mb-2">RESPONSE (201)</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`{
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
}`}
        </pre>
      </div>

      {/* POST /marketplace/bids/:bidId/accept */}
      <div className="mb-8 border border-white p-6">
        <div className="mb-4">
          <span className="bg-green-500 text-black px-2 py-1 font-bold mr-2">POST</span>
          <code className="font-mono">/v1/marketplace/bids/:bidId/accept</code>
        </div>
        <p className="mb-4 text-white/80">Accept a bid (creates ownership record)</p>
        
        <h4 className="font-bold mb-2">REQUEST</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`curl -X POST http://localhost:3000/v1/marketplace/bids/bid_001/accept \\
  -H "X-API-KEY: pk_abc123" \\
  -H "X-USER-ID: issuer_john" \\
  -H "X-SIGNATURE: dummy_signature_for_testing" \\
  -H "X-TIMESTAMP: $(date +%s)"`}
        </pre>

        <h4 className="font-bold mb-2">RESPONSE (200)</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`{
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
}`}
        </pre>
      </div>

      {/* GET /marketplace/my-listings */}
      <div className="mb-8 border border-white p-6">
        <div className="mb-4">
          <span className="bg-blue-500 text-black px-2 py-1 font-bold mr-2">GET</span>
          <code className="font-mono">/v1/marketplace/my-listings</code>
        </div>
        <p className="mb-4 text-white/80">Get current user's listings (requires X-USER-ID)</p>
        
        <h4 className="font-bold mb-2">RESPONSE (200)</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`{
  "success": true,
  "data": [
    {
      "id": "listing_001",
      "assetId": "property_001",
      "price": "100.00",
      "quantityListed": 100,
      "quantitySold": 75,
      "status": "ACTIVE",
      "bids": [...]
    }
  ]
}`}
        </pre>
      </div>

      {/* GET /marketplace/my-portfolio */}
      <div className="mb-8 border border-white p-6">
        <div className="mb-4">
          <span className="bg-blue-500 text-black px-2 py-1 font-bold mr-2">GET</span>
          <code className="font-mono">/v1/marketplace/my-portfolio</code>
        </div>
        <p className="mb-4 text-white/80">Get current user's owned tokens (requires X-USER-ID)</p>
        
        <h4 className="font-bold mb-2">RESPONSE (200)</h4>
        <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto mb-4">
{`{
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
}`}
        </pre>
      </div>
    </section>
  );
}


// Workflow Section
function WorkflowSection() {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold uppercase mb-6 border-b border-white pb-2">
        4. Complete Workflow Example
      </h2>
      <div className="border border-white p-6 mb-4">
        <h3 className="font-bold mb-4">STEP-BY-STEP FLOW</h3>
        <ol className="pl-6 space-y-3">
          <li className="mb-2">
            <strong>Step 1:</strong> Platform owner registers and generates API keys (MAKER + CHECKER)
          </li>
          <li className="mb-2">
            <strong>Step 2:</strong> Issuer links asset to custody
            <pre className="bg-black text-green-500 p-2 border border-white font-mono text-xs mt-2">
POST /custody/link
            </pre>
          </li>
          <li className="mb-2">
            <strong>Step 3:</strong> Issuer creates mint operation
            <pre className="bg-black text-green-500 p-2 border border-white font-mono text-xs mt-2">
POST /operations/mint
            </pre>
          </li>
          <li className="mb-2">
            <strong>Step 4:</strong> Checker approves operation
            <pre className="bg-black text-green-500 p-2 border border-white font-mono text-xs mt-2">
POST /operations/:id/approve
            </pre>
          </li>
          <li className="mb-2">
            <strong>Step 5:</strong> System mints tokens on blockchain (automatic after approval)
          </li>
          <li className="mb-2">
            <strong>Step 6:</strong> Issuer lists tokens on marketplace
            <pre className="bg-black text-green-500 p-2 border border-white font-mono text-xs mt-2">
POST /marketplace/listings
            </pre>
          </li>
          <li className="mb-2">
            <strong>Step 7:</strong> Investor places bid
            <pre className="bg-black text-green-500 p-2 border border-white font-mono text-xs mt-2">
POST /marketplace/listings/:id/bids
            </pre>
          </li>
          <li className="mb-2">
            <strong>Step 8:</strong> Issuer accepts bid
            <pre className="bg-black text-green-500 p-2 border border-white font-mono text-xs mt-2">
POST /marketplace/bids/:id/accept
            </pre>
          </li>
          <li className="mb-2">
            <strong>Step 9:</strong> Ownership record created in off-chain ledger (automatic)
          </li>
          <li className="mb-2">
            <strong>Step 10:</strong> Investor views portfolio
            <pre className="bg-black text-green-500 p-2 border border-white font-mono text-xs mt-2">
GET /marketplace/my-portfolio
            </pre>
          </li>
        </ol>
      </div>
    </section>
  );
}

// Errors Section
function ErrorsSection() {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold uppercase mb-6 border-b border-white pb-2">
        5. Error Responses
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-white p-4">
          <div className="font-bold mb-2">400 Bad Request</div>
          <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto">
{`{
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "details": [...]
  }
}`}
          </pre>
        </div>
        <div className="border border-white p-4">
          <div className="font-bold mb-2">401 Unauthorized</div>
          <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto">
{`{
  "error": {
    "message": "Invalid API key",
    "statusCode": 401
  }
}`}
          </pre>
        </div>
        <div className="border border-white p-4">
          <div className="font-bold mb-2">403 Forbidden</div>
          <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto">
{`{
  "error": {
    "message": "Access denied",
    "statusCode": 403
  }
}`}
          </pre>
        </div>
        <div className="border border-white p-4">
          <div className="font-bold mb-2">404 Not Found</div>
          <pre className="bg-black text-green-500 p-4 border border-white font-mono text-sm overflow-auto">
{`{
  "error": {
    "message": "Resource not found",
    "statusCode": 404
  }
}`}
          </pre>
        </div>
      </div>
    </section>
  );
}

// OpenAPI Section
function OpenAPISection() {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold uppercase mb-6 border-b border-white pb-2">
        OpenAPI Specification
      </h2>
      <div className="border border-white p-6">
        <p className="mb-6 leading-relaxed">
          Download the complete OpenAPI specification for integration with API tools like Postman, Swagger, or Insomnia.
          The specification includes all endpoints, request/response schemas, and authentication requirements.
        </p>
        <div className="text-center">
          <a
            href="http://localhost:3000/v1/docs/openapi.yaml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-white text-black no-underline border border-white font-bold uppercase hover:bg-black hover:text-white transition-colors"
          >
            Download OpenAPI Spec
          </a>
        </div>
      </div>
    </section>
  );
}
