# ⚙️ Xeno CRM — Backend

> Node.js + Express + TypeScript + MongoDB Atlas  
> Production-quality REST API for the Xeno Mini CRM assignment.

---

## 📁 Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.ts                  # MongoDB Atlas connection via Mongoose
│   │
│   ├── models/
│   │   ├── Customer.ts            # Customer schema + computed fields
│   │   ├── Order.ts               # Order schema with Customer ref
│   │   ├── Campaign.ts            # Campaign schema with status enum
│   │   ├── Communication.ts       # Per-recipient delivery record
│   │   └── Segment.ts             # Named audience segments
│   │
│   ├── routes/
│   │   ├── customerRoutes.ts
│   │   ├── orderRoutes.ts
│   │   ├── campaignRoutes.ts
│   │   ├── segmentRoutes.ts
│   │   ├── analyticsRoutes.ts
│   │   ├── dashboardRoutes.ts
│   │   ├── receiptRoutes.ts
│   │   └── aiRoutes.ts
│   │
│   ├── controllers/
│   │   ├── customerController.ts
│   │   ├── orderController.ts
│   │   ├── campaignController.ts
│   │   ├── segmentController.ts
│   │   ├── analyticsController.ts
│   │   ├── dashboardController.ts
│   │   ├── receiptController.ts
│   │   └── aiController.ts
│   │
│   ├── services/
│   │   ├── aiService.ts           # Provider pattern: Groq / Gemini / Ollama
│   │   ├── campaignService.ts     # Audience resolution + message dispatch
│   │   └── channelService.ts      # Calls the stub channel service
│   │
│   ├── middlewares/
│   │   └── errorHandler.ts        # Global error handler middleware
│   │
│   ├── utils/
│   │   └── seed.ts                # Faker.js — seeds 1000 customers + 5000 orders
│   │
│   ├── app.ts                     # Express app setup, middleware, routes
│   └── server.ts                  # Entry point — connects DB then starts server
│
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🔌 API Reference

### Customers

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/customers` | List customers (paginated, searchable) |
| `POST` | `/customers` | Create a customer |

**Query params for GET /customers:**
```
?page=1&limit=10&search=rahul&city=Mumbai
```

**Response:**
```json
{
  "customers": [
    {
      "_id": "...",
      "name": "Rahul Sharma",
      "email": "rahul@example.com",
      "city": "Mumbai",
      "totalSpent": 12500,
      "lastPurchaseDate": "2026-05-10T00:00:00.000Z",
      "orderCount": 7
    }
  ],
  "totalPages": 100,
  "currentPage": 1,
  "totalCount": 1000
}
```

---

### Orders

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/orders` | List all orders |
| `POST` | `/orders` | Create an order |

**POST /orders body:**
```json
{
  "customerId": "64abc...",
  "amount": 2500,
  "date": "2026-06-12"
}
```

---

### Campaigns

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/campaigns` | List all campaigns |
| `POST` | `/campaigns` | Create and launch a campaign |
| `GET` | `/campaigns/:id` | Get campaign details + delivery stats |

**POST /campaigns body:**
```json
{
  "name": "Summer Comeback",
  "channel": "WhatsApp",
  "message": "Hi {{name}}, we've missed you! Enjoy 15% OFF. Use COMEBACK15.",
  "segment": {
    "minSpent": 5000,
    "inactiveDays": 30
  },
  "status": "ACTIVE"
}
```

---

### AI Endpoints ⭐

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ai/chat` | Natural language → audience + campaign |
| `POST` | `/ai/segment` | NL → segment criteria JSON |
| `POST` | `/ai/message` | Generate campaign message |

**POST /ai/chat body:**
```json
{
  "query": "Bring back inactive premium customers"
}
```

**Response:**
```json
{
  "audienceSize": 127,
  "message": "Hi {{name}}, it's been a while! Your next order gets 15% OFF — exclusively for our top customers. Use PREMIUM15. Valid till Sunday.",
  "subject": "We saved something special for you ✨",
  "channel": "WhatsApp",
  "estimatedConversionRate": 11.3
}
```

---

### Analytics & Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics` | Campaign delivery + engagement totals |
| `GET` | `/dashboard` | Summary stats + chart data |

**GET /analytics response:**
```json
{
  "totalCampaigns": 12,
  "sent": 3200,
  "delivered": 3050,
  "opened": 2600,
  "clicked": 980,
  "failed": 150,
  "conversions": 210,
  "engagementTrends": [...],
  "deliveryChannels": [...],
  "conversionTrends": [...]
}
```

---

### Receipt Callback (Channel Service → CRM)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/receipt` | Receive async delivery status update |

**POST /receipt body:**
```json
{
  "campaignId": "...",
  "customerId": "...",
  "status": "DELIVERED"
}
```

**Status enum:** `SENT | DELIVERED | OPENED | READ | CLICKED | PURCHASED | FAILED`

---

## 🗄️ MongoDB Schemas

### Customer
```typescript
{
  name: string
  email: string (unique)
  phone: string
  age: number
  gender: 'M' | 'F' | 'Other'
  city: string
  createdAt: Date
  updatedAt: Date
}
```

### Order
```typescript
{
  customerId: ObjectId (ref: Customer)
  amount: number
  date: Date
  createdAt: Date
}
```

### Campaign
```typescript
{
  name: string
  channel: 'WhatsApp' | 'Email' | 'SMS' | 'RCS'
  message: string
  segment: {
    minSpent?: number
    inactiveDays?: number
    minAge?: number
    maxAge?: number
    city?: string
  }
  audienceSize: number
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'PAUSED'
  createdAt: Date
}
```

### Communication
```typescript
{
  campaignId: ObjectId (ref: Campaign)
  customerId: ObjectId (ref: Customer)
  channel: string
  message: string
  status: 'SENT' | 'DELIVERED' | 'OPENED' | 'READ' | 'CLICKED' | 'PURCHASED' | 'FAILED'
  timestamp: Date
  updatedAt: Date
}
```

---

## 🤖 AI Service — Provider Pattern

The AI service uses a **provider pattern** so you can swap LLM providers without changing business logic:

```typescript
// services/aiService.ts
interface AIProvider {
  generate(prompt: string): Promise<string>;
}

class GroqProvider implements AIProvider { ... }
class GeminiProvider implements AIProvider { ... }
class OllamaProvider implements AIProvider { ... }

// Switch provider by changing one env variable
const provider = process.env.AI_PROVIDER === 'gemini'
  ? new GeminiProvider()
  : new GroqProvider();

export const generate = (prompt: string) => provider.generate(prompt);
```

---

## 🌱 Seed Data

```bash
npm run seed
```

Seeds using **Faker.js**:
- ✅ 1000 realistic Indian customers (name, city, phone, age, gender)
- ✅ 5000 orders spread across the last 6 months
- ✅ Customers have varying spend patterns (₹500 – ₹50,000)

---

## ⚙️ Setup & Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file from `.env.example`:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/xeno-crm
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
AI_PROVIDER=groq
CHANNEL_SERVICE_URL=http://localhost:5001
FRONTEND_URL=http://localhost:5173
```

### Running Locally

```bash
# Development (with hot reload)
npm run dev

# Seed the database first
npm run seed

# Build for production
npm run build

# Start production build
npm start
```

Server runs at `http://localhost:5000`

---

## 🚢 Deployment (Render)

1. Push `backend/` to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Set **Root Directory** → `backend`
4. **Build command:** `npm install && npm run build`
5. **Start command:** `npm start`
6. Add all environment variables from `.env`
7. Deploy ✅

---

## 🧪 Testing with Postman

Import this collection to test all endpoints:

```
Base URL: http://localhost:5000
```

**Quick sanity checks:**
```bash
# Health check
GET /health

# Get customers
GET /customers?page=1&limit=10

# AI Chat
POST /ai/chat
Body: { "query": "Bring back inactive premium customers" }

# Analytics
GET /analytics
```

---

## 🏗️ Architecture Decisions & Tradeoffs

| Decision | Chosen Approach | Reason | Scale Alternative |
|---|---|---|---|
| ORM | Mongoose | Schema validation + aggregation pipeline support | Prisma for relational |
| AI calls | Synchronous | Simple for assignment scope | Async queue + streaming |
| Callbacks | `setTimeout` simulation | Realistic async loop without infra | BullMQ + Redis |
| Auth | None | Out of scope per assignment | JWT + refresh tokens |
| Retry logic | Single attempt | Scope tradeoff | Exponential backoff |

---

## 🧩 Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20 | Runtime |
| Express | 4 | HTTP framework |
| TypeScript | 5 | Type safety |
| Mongoose | 8 | MongoDB ODM |
| Groq SDK | Latest | LLM inference (LLaMA 3) |
| Faker.js | 8 | Realistic seed data |
| dotenv | 16 | Environment config |
| cors | 2 | Cross-origin requests |
| ts-node-dev | 2 | Dev server with hot reload |
