# AssetLink Platform

> **API‑first Asset Linking & Custody System**  
> Brutalist UI • JavaScript only • OpenAPI‑driven • Fireblocks‑style

---

## 1. Vision

AssetLink is a **backend‑first, API‑driven custody bridge** that allows platforms to:

- Link real‑world or off‑chain assets
- Mint on‑chain tokens against linked assets
- Manage custody wallets (Fireblocks‑style)
- Integrate via clean, public APIs

The frontend is **minimal, raw, black‑and‑white**, built purely as a **control panel**, not a product website.

---

## 2. Design Principles

- API is the product
- Frontend is replaceable
- Backend is the source of truth
- No frontend auth logic
- No colors, no gradients, no fluff

---

## 3. Tech Stack (Strict)

### Frontend
- React (Vite)
- JavaScript (NO TypeScript)
- React Router
- Zustand (auth state)
- Axios
- Tailwind (black & white only)

### Backend
- Node.js
- Express
- JWT Auth
- PostgreSQL / MySQL
- OpenAPI (Swagger)

---

## 4. Roles & Access Model

| Role | Description | Access |
|---|---|---|
| CLIENT | API consumer / issuer | Own data only |
| ADMIN | Internal super admin | Full access |

Roles are enforced **only in backend**.

---

## 5. URL Structure & Connection

```txt
AssetLink API (Base):   http://localhost:3000/v1
AssetLink Dashboard:    http://localhost:3000/dashboard

Your Backend (e.g.):   http://localhost:5000
```

### Path Requirements
All API calls must use the `/v1` prefix. For HMAC signatures, the path must be the full path including versioning (e.g., `/v1/custody/link`).

---

## 6. Frontend Application (UI + UX)

### UI Style Rules (Non‑Negotiable)

- Background: `#000000`
- Text: `#FFFFFF`
- Borders: `1px solid #FFFFFF`
- No colors
- No gradients
- No shadows
- No rounded corners
- Typography: Inter / IBM Plex Mono

The UI must feel **raw, terminal‑like, infrastructure‑grade**.

---

### Pages Overview

| Page | URL | Access |
|----|----|----|
| Client Login | /login | Public |
| Client Register | /register | Public |
| Client Dashboard | /dashboard | CLIENT |
| Asset Links | /dashboard/assets | CLIENT |
| Token Minting | /dashboard/mint | CLIENT |
| API Keys | /dashboard/api-keys | CLIENT |
| Settings | /dashboard/settings | CLIENT |
| Admin Login | /admin/login | ADMIN |
| Admin Dashboard | /admin/dashboard | ADMIN |
| Admin Users | /admin/users | ADMIN |
| Admin Assets | /admin/assets | ADMIN |
| Admin Audit Logs | /admin/audit-logs | ADMIN |
| Public API Docs | /docs | Public |

---

## 7. Frontend Folder Structure

```txt
src/
├── app/
│   ├── router.js
│   ├── authGuard.js
│   └── adminGuard.js
│
├── pages/
│   ├── auth/
│   │   ├── Login.js
│   │   └── Register.js
│   │
│   ├── dashboard/
│   │   ├── Overview.js
│   │   ├── Assets.js
│   │   ├── Mint.js
│   │   ├── ApiKeys.js
│   │   └── Settings.js
│   │
│   ├── admin/
│   │   ├── Login.js
│   │   ├── Dashboard.js
│   │   ├── Users.js
│   │   ├── Assets.js
│   │   └── AuditLogs.js
│   │
│   └── docs/
│       └── ApiDocs.js
│
├── components/
│   ├── Sidebar.js
│   ├── Topbar.js
│   ├── Table.js
│   └── LineInput.js
│
├── services/
│   ├── api.js
│   ├── auth.service.js
│   ├── asset.service.js
│   └── admin.service.js
│
├── store/
│   └── auth.store.js
│
└── styles/
    └── brutal.css
```

---

## 8. Authentication & Role System (Backend‑Driven)

### Strategy

- JavaScript only (no TS)
- JWT access token (15 minutes)
- Refresh token (httpOnly cookie)
- Role embedded in JWT payload
- Frontend only checks token presence

### JWT Payload Example

```json
{
  "sub": "user_id",
  "role": "CLIENT",
  "email": "user@platform.com",
  "iat": 1710000000,
  "exp": 1710000900
}
```

---

### Auth APIs

```http
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

---

### Admin Auth (Hidden Route)

```http
POST /admin/login
```

Admin login is **not linked anywhere** in the UI.

---

### Strategy
- JWT (15 min)
- Refresh Token (httpOnly cookie)
- Role embedded in JWT

### Auth Endpoints

```http
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

### Admin Auth

```http
POST /admin/login
```

---

## 8. Database Models (Core)

### Users
```sql
id (uuid)
email
password_hash
role (CLIENT | ADMIN)
status (ACTIVE | SUSPENDED)
created_at
```

### API Keys
```sql
id
user_id
key_hash
scopes
last_used_at
created_at
```

### Assets
```sql
id
asset_id
asset_type
vault_id
status
user_id
created_at
```

### Audit Logs
```sql
id
action
entity
entity_id
performed_by
created_at
```

---

## 9. Client Dashboard Features

### Overview
- Total assets
- Total minted tokens
- API usage

### Asset Links
```http
GET /v1/assets
POST /v1/assets/link
```

### Token Minting
```http
POST /v1/tokens/mint
```

### API Key Management
```http
POST /v1/api-keys
GET  /v1/api-keys
DELETE /v1/api-keys/{id}
```

---

## 10. Admin Dashboard Features

Admin can:
- View all users
- View all assets
- View all mint events
- View audit logs

```http
GET /admin/users
GET /admin/assets
GET /admin/transactions
GET /admin/audit-logs
```

---

## 11. Public API Documentation (/docs)

- No login required
- Swagger UI
- OpenAPI‑powered

Sections:
- Introduction
- Authentication
- Asset Linking
- Token Minting
- Errors
- Webhooks

---

## 13. OpenAPI (Core Feature, Not Optional)

OpenAPI is used for:

- Public API documentation (/docs)
- Swagger UI (Fireblocks‑style)
- Request validation
- SDK generation
- Frontend‑backend contract safety

---

### OpenAPI Specification (Starter)

```yaml
openapi: 3.0.3
info:
  title: AssetLink API
  version: 1.0.0
  description: API‑first asset linking and custody platform

servers:
  - url: http://localhost:3000

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - BearerAuth: []

paths:
  /auth/login:
    post:
      summary: Client login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: Login success

  /v1/assets:
    get:
      summary: Get linked assets for user
      responses:
        '200':
          description: Asset list

  /v1/assets/link:
    post:
      summary: Link an asset with files
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - assetId
                - assetName
                - category
                - storageType
                - estimatedValue
                - currency
                - ownershipDocument
                - assetImages
              properties:
                assetId:
                  type: string
                assetName:
                  type: string
                category:
                  type: string
                storageType:
                  type: string
                estimatedValue:
                  type: number
                currency:
                  type: string
                ownershipDocument:
                  type: string
                  format: binary
                assetImages:
                  type: array
                  items:
                    type: string
                    format: binary
                assetVideo:
                  type: string
                  format: binary
      responses:
        '201':
          description: Asset linked

  /v1/tokens/mint:
    post:
      summary: Mint tokens
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                assetId:
                  type: string
                amount:
                  type: number
      responses:
        '200':
          description: Mint successful
```

---

```yaml
openapi: 3.0.3
info:
  title: AssetLink API
  version: 1.0.0
  description: API‑first asset linking and custody system

servers:
  - url: https://api.assetlink.io

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: Authorization

security:
  - ApiKeyAuth: []

paths:
  /v1/assets/link:
    post:
      summary: Link an asset with files
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - assetId
                - assetName
                - category
                - storageType
                - estimatedValue
                - currency
                - ownershipDocument
                - assetImages
              properties:
                assetId:
                  type: string
                assetName:
                  type: string
                category:
                  type: string
                storageType:
                  type: string
                estimatedValue:
                  type: number
                currency:
                  type: string
                ownershipDocument:
                  type: string
                  format: binary
                assetImages:
                  type: array
                  items:
                    type: string
                    format: binary
      responses:
        '201':
          description: Asset linked

  /v1/tokens/mint:
    post:
      summary: Mint tokens for a linked asset
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                assetId:
                  type: string
                amount:
                  type: number
      responses:
        '200':
          description: Tokens minted
```

---

## 13. Security Requirements

- Hash API keys
- Rate‑limit auth endpoints
- Audit log everything
- IP restrict admin APIs
- Validate requests via OpenAPI middleware

---

## 14. Why This Architecture Works

- API is reusable
- Frontend is replaceable
- Enterprise‑ready
- Auditor‑friendly
- Easy to scale

---

## 15. Future Extensions

- SDK generation (JS / Python)
- Webhooks
- Multi‑tenant orgs
- Role‑based scopes
- API versioning (/v2)

---

**AssetLink is not a UI product. It’s an infrastructure layer.**

