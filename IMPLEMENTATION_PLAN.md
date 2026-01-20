# Muraqqa - Implementation Plan

**Based on:** FEATURE_GAPS.md Analysis
**Date:** January 21, 2026
**Current Status:** Phase 1 Complete (Authentication & Database Foundation)

---

## Project Overview

Muraqqa is a Pakistani art gallery marketplace with a comprehensive React frontend and a partially implemented Express/Prisma backend. The authentication system is complete; the next phases focus on connecting the existing UI to real backend APIs.

---

## Implementation Phases

### Phase 2: Artwork & Artist APIs (Priority: Critical)

The frontend already has complete UI for gallery browsing, artwork details, and artist management. These need backend endpoints.

#### 2.1 Artwork CRUD API
**Files to create:**
- `server/src/routes/artwork.routes.ts`
- `server/src/controllers/artwork.controller.ts`
- `server/src/validators/artwork.validator.ts`

**Endpoints:**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/artworks` | Public | List all artworks with filters |
| GET | `/api/artworks/:id` | Public | Get single artwork details |
| POST | `/api/artworks` | ARTIST | Create new artwork |
| PUT | `/api/artworks/:id` | ARTIST | Update artwork |
| DELETE | `/api/artworks/:id` | ARTIST | Delete artwork |
| GET | `/api/artworks/artist/:artistId` | Public | Get artist's artworks |

**Query Parameters for GET /api/artworks:**
- `category` - Filter by category (Miniature, Calligraphy, etc.)
- `medium` - Filter by medium (Oil, Watercolor, etc.)
- `minPrice`, `maxPrice` - Price range
- `search` - Text search on title/description
- `sortBy` - price, createdAt, title
- `page`, `limit` - Pagination

**Frontend Integration:**
- Update `constants.ts` to fetch from API instead of MOCK_ARTWORKS
- Modify `GalleryContext.tsx` to use API calls
- Update `Gallery.tsx` to handle loading/error states

#### 2.2 Artist API
**Files to create:**
- `server/src/routes/artist.routes.ts`
- `server/src/controllers/artist.controller.ts`

**Endpoints:**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/artists` | Public | List all artists |
| GET | `/api/artists/:id` | Public | Get artist profile |
| PUT | `/api/artists/:id` | ARTIST | Update own profile |
| GET | `/api/artists/:id/stats` | ARTIST | Get sales/view stats |

**Frontend Integration:**
- Create artist profile pages
- Connect `ArtistDashboard.tsx` to real data
- Update `Artists.tsx` page

#### 2.3 Image Upload System
**Files to create:**
- `server/src/routes/upload.routes.ts`
- `server/src/controllers/upload.controller.ts`
- `server/src/config/cloudinary.ts` (or S3)

**Implementation:**
- Integrate Cloudinary or AWS S3 for image storage
- Support multiple image uploads per artwork
- Generate optimized thumbnails
- Return CDN URLs for frontend

---

### Phase 3: Order & Cart System (Priority: Critical)

#### 3.1 Order Management API
**Files to create:**
- `server/src/routes/order.routes.ts`
- `server/src/controllers/order.controller.ts`
- `server/src/validators/order.validator.ts`

**Endpoints:**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | USER | Create new order |
| GET | `/api/orders` | USER | Get user's orders |
| GET | `/api/orders/:id` | USER | Get order details |
| PUT | `/api/orders/:id/status` | ADMIN | Update order status |
| GET | `/api/admin/orders` | ADMIN | Get all orders |

**Order Creation Flow:**
1. Validate cart items and stock availability
2. Calculate totals with currency conversion
3. Create order with PENDING status
4. Return order ID for payment processing
5. Update stock quantities

**Frontend Integration:**
- Connect `Cart.tsx` checkout to create order
- Add order confirmation page
- Update `UserProfile.tsx` with order history
- Connect `AdminDashboard.tsx` order management

#### 3.2 Cart Persistence (Optional Enhancement)
**Current:** Cart stored in React context (lost on refresh)
**Enhancement:** Store cart in localStorage or database

---

### Phase 4: Payment Integration (Priority: Critical)

#### 4.1 Stripe Integration
**Files to create:**
- `server/src/routes/payment.routes.ts`
- `server/src/controllers/payment.controller.ts`
- `server/src/webhooks/stripe.webhook.ts`

**Endpoints:**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/create-intent` | USER | Create Stripe PaymentIntent |
| POST | `/api/payments/webhook` | Public | Stripe webhook handler |
| GET | `/api/payments/:orderId` | USER | Get payment status |

**Environment Variables:**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Frontend Integration:**
- Install `@stripe/stripe-js` and `@stripe/react-stripe-js`
- Create payment form component
- Handle payment success/failure redirects
- Update `Cart.tsx` checkout flow

#### 4.2 Bank Transfer Option
**Implementation:**
- Generate unique order reference
- Display bank account details
- Admin manually confirms payment
- Update order status to PAID

---

### Phase 5: Shipping Integration (Priority: High)

#### 5.1 Shipping Rates API
**Files to create:**
- `server/src/routes/shipping.routes.ts`
- `server/src/controllers/shipping.controller.ts`
- `server/src/services/dhl.service.ts`

**Endpoints:**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/shipping/rates` | USER | Get shipping rates |
| POST | `/api/shipping/create-label` | ADMIN | Create shipping label |
| GET | `/api/shipping/track/:trackingNumber` | Public | Track shipment |

**Implementation Options:**
1. **DHL API Integration** - For international shipping
2. **EasyPost** - Multi-carrier aggregator (simpler integration)
3. **Manual Rates** - Flat rate based on zones (MVP approach)

**MVP Approach:**
```typescript
const shippingRates = {
  domestic: { standard: 500, express: 1200 }, // PKR
  international: {
    asia: 8500,
    europe: 12000,
    americas: 15000,
  }
};
```

---

### Phase 6: User Features (Priority: High)

#### 6.1 User Profile API
**Files to create:**
- `server/src/routes/user.routes.ts`
- `server/src/controllers/user.controller.ts`

**Endpoints:**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/profile` | USER | Get own profile |
| PUT | `/api/users/profile` | USER | Update profile |
| PUT | `/api/users/password` | USER | Change password |
| POST | `/api/users/addresses` | USER | Add shipping address |
| GET | `/api/users/addresses` | USER | Get saved addresses |
| DELETE | `/api/users/addresses/:id` | USER | Delete address |

#### 6.2 Wishlist/Favorites
**Database Addition:**
```prisma
model Wishlist {
  id        String   @id @default(uuid())
  userId    String
  artworkId String
  user      User     @relation(fields: [userId], references: [id])
  artwork   Artwork  @relation(fields: [artworkId], references: [id])
  createdAt DateTime @default(now())
  @@unique([userId, artworkId])
}
```

**Endpoints:**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/wishlist` | USER | Get user's wishlist |
| POST | `/api/wishlist/:artworkId` | USER | Add to wishlist |
| DELETE | `/api/wishlist/:artworkId` | USER | Remove from wishlist |

---

### Phase 7: Admin Features (Priority: Medium)

#### 7.1 Admin Dashboard API
**Files to create:**
- `server/src/routes/admin.routes.ts`
- `server/src/controllers/admin.controller.ts`

**Endpoints:**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/stats` | ADMIN | Dashboard statistics |
| GET | `/api/admin/orders` | ADMIN | All orders with filters |
| PUT | `/api/admin/orders/:id` | ADMIN | Update order status |
| GET | `/api/admin/users` | ADMIN | User management |
| PUT | `/api/admin/users/:id/role` | ADMIN | Change user role |
| GET | `/api/admin/artworks` | ADMIN | Artwork management |
| PUT | `/api/admin/artworks/:id/approve` | ADMIN | Approve/reject artwork |

**Dashboard Stats:**
```typescript
interface DashboardStats {
  totalRevenue: number;
  ordersToday: number;
  pendingOrders: number;
  totalArtworks: number;
  totalArtists: number;
  totalUsers: number;
  recentOrders: Order[];
  topSellingArtworks: Artwork[];
}
```

#### 7.2 Site Content Management
**Database Addition:**
```prisma
model SiteContent {
  id        String   @id @default(uuid())
  key       String   @unique
  value     Json
  updatedAt DateTime @updatedAt
}
```

**Endpoints:**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/content/:key` | Public | Get content by key |
| PUT | `/api/content/:key` | ADMIN | Update content |

---

### Phase 8: Notifications (Priority: Medium)

#### 8.1 Email Notifications
**Files to create:**
- `server/src/services/email.service.ts`
- `server/src/templates/` (email templates)

**Integration Options:**
1. **SendGrid** - Recommended for transactional emails
2. **Mailgun** - Alternative option
3. **AWS SES** - Cost-effective at scale

**Email Types:**
- Order confirmation
- Shipping notification
- Password reset
- Welcome email
- Artist: New sale notification

#### 8.2 Password Reset Flow
**Endpoints:**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/forgot-password` | Public | Send reset email |
| POST | `/api/auth/reset-password` | Public | Reset with token |

**Database Addition:**
```prisma
model PasswordReset {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
}
```

---

### Phase 9: Reviews & Ratings (Priority: Low)

**Endpoints:**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/artworks/:id/reviews` | Public | Get artwork reviews |
| POST | `/api/artworks/:id/reviews` | USER | Add review |
| PUT | `/api/reviews/:id` | USER | Update own review |
| DELETE | `/api/reviews/:id` | USER | Delete own review |

**Validation:**
- User must have purchased the artwork to review
- One review per user per artwork

---

### Phase 10: Search & Filtering Enhancement (Priority: Low)

#### 10.1 Full-Text Search
**Options:**
1. **PostgreSQL Full-Text Search** - Built-in, no extra dependencies
2. **Elasticsearch** - More powerful, separate service
3. **Algolia** - Managed search service

**PostgreSQL Implementation:**
```sql
-- Add tsvector column
ALTER TABLE artworks ADD COLUMN search_vector tsvector;

-- Create index
CREATE INDEX artworks_search_idx ON artworks USING gin(search_vector);

-- Update trigger
CREATE TRIGGER artworks_search_update
  BEFORE INSERT OR UPDATE ON artworks
  FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', title, description);
```

---

## File Structure After Implementation

```
server/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── controllers/
│   │   ├── auth.controller.ts      ✅ Exists
│   │   ├── artwork.controller.ts   📝 Phase 2
│   │   ├── artist.controller.ts    📝 Phase 2
│   │   ├── order.controller.ts     📝 Phase 3
│   │   ├── payment.controller.ts   📝 Phase 4
│   │   ├── shipping.controller.ts  📝 Phase 5
│   │   ├── user.controller.ts      📝 Phase 6
│   │   └── admin.controller.ts     📝 Phase 7
│   ├── routes/
│   │   ├── auth.routes.ts          ✅ Exists
│   │   ├── artwork.routes.ts       📝 Phase 2
│   │   ├── artist.routes.ts        📝 Phase 2
│   │   ├── upload.routes.ts        📝 Phase 2
│   │   ├── order.routes.ts         📝 Phase 3
│   │   ├── payment.routes.ts       📝 Phase 4
│   │   ├── shipping.routes.ts      📝 Phase 5
│   │   ├── user.routes.ts          📝 Phase 6
│   │   └── admin.routes.ts         📝 Phase 7
│   ├── middleware/
│   │   └── auth.middleware.ts      ✅ Exists
│   ├── services/
│   │   ├── stripe.service.ts       📝 Phase 4
│   │   ├── shipping.service.ts     📝 Phase 5
│   │   ├── email.service.ts        📝 Phase 8
│   │   └── cloudinary.service.ts   📝 Phase 2
│   ├── validators/
│   │   ├── auth.validator.ts       ✅ Exists
│   │   ├── artwork.validator.ts    📝 Phase 2
│   │   └── order.validator.ts      📝 Phase 3
│   ├── utils/
│   │   └── jwt.ts                  ✅ Exists
│   └── config/
│       ├── env.ts                  ✅ Exists
│       └── database.ts             ✅ Exists
├── prisma/
│   ├── schema.prisma               ✅ Exists (needs updates)
│   └── seed.ts                     ✅ Exists
└── package.json                    ✅ Exists
```

---

## Environment Variables (Final)

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/muraqqa

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-12-chars
JWT_EXPIRES_IN=7d

# Frontend
CLIENT_URL=http://localhost:5173

# Stripe (Phase 4)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary (Phase 2)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Email - SendGrid (Phase 8)
SENDGRID_API_KEY=SG...
FROM_EMAIL=noreply@muraqqa.com

# Optional: DHL (Phase 5)
DHL_API_KEY=...
DHL_API_SECRET=...
```

---

## Recommended Implementation Order

### Immediate (This Sprint)
1. **Artwork API** - Core functionality for gallery
2. **Artist API** - Artist profiles and management
3. **Image Upload** - Required for artwork creation

### Next Sprint
4. **Order API** - Cart checkout functionality
5. **Payment Integration** - Stripe for real transactions
6. **Shipping Rates** - At minimum, flat rate shipping

### Following Sprint
7. **User Profile** - Profile management, addresses
8. **Admin Dashboard** - Real statistics and management
9. **Email Notifications** - Order confirmations

### Future
10. **Reviews & Ratings**
11. **Advanced Search**
12. **Wishlist**
13. **Password Reset**

---

## Dependencies to Add

### Backend (server/package.json)
```json
{
  "dependencies": {
    "stripe": "^14.0.0",
    "cloudinary": "^1.41.0",
    "@sendgrid/mail": "^8.0.0",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "@types/multer": "^1.4.11"
  }
}
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "@stripe/stripe-js": "^2.0.0",
    "@stripe/react-stripe-js": "^2.0.0"
  }
}
```

---

## Testing Strategy

### Unit Tests
- Controller functions with mocked services
- Validator schemas
- Utility functions

### Integration Tests
- API endpoints with test database
- Authentication flows
- Order creation flow

### E2E Tests
- Full checkout flow
- User registration and login
- Artist artwork upload

---

## Security Checklist

- [ ] Move Gemini API key to backend (currently exposed in frontend)
- [ ] Add rate limiting to all public endpoints
- [ ] Implement CSRF protection for forms
- [ ] Add input sanitization for user content
- [ ] Use parameterized queries (Prisma handles this)
- [ ] Validate file uploads (type, size)
- [ ] Implement request validation on all endpoints
- [ ] Add security headers (helmet already configured)
- [ ] Implement proper error handling (don't leak stack traces)

---

## Notes

1. **Database migrations:** After updating schema.prisma, run:
   ```bash
   npx prisma migrate dev --name <migration_name>
   ```

2. **Seeding:** Update seed.ts when adding new models:
   ```bash
   npm run seed
   ```

3. **API Documentation:** Consider adding Swagger/OpenAPI:
   ```bash
   npm install swagger-ui-express swagger-jsdoc
   ```

4. **Frontend API Client:** Create a centralized API client:
   ```typescript
   // services/api.ts
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

   export const api = {
     get: (path: string) => fetch(`${API_URL}${path}`, { headers: authHeaders() }),
     post: (path: string, body: any) => fetch(`${API_URL}${path}`, { method: 'POST', ... }),
     // ...
   };
   ```

---

**Ready to start implementation? Begin with Phase 2: Artwork & Artist APIs.**
