# QueenDeQ Platform API Documentation

## Overview

This API provides endpoints for a chat-based web application with user authentication, subscription management, and OpenAI integration.

## Base URL
```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PATCH /api/auth/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "preferences": {
    "theme": "dark",
    "language": "en"
  }
}
```

### Chat Sessions (`/api/ai`)

#### Create New Chat Session
```http
POST /api/ai/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My New Chat",
  "chatType": "poiche"
}
```

**Available Chat Types:**
- `poiche`: Free archetype identification 
- `miroir_free`: Free mirror reading (limited depth)
- `miroir_paid`: Premium mirror reading mode (full depth)
- `salon_de_the`: Premium tea salon ritual mode

**Response:**
```json
{
  "success": true,
  "session": {
    "_id": "...",
    "title": "My New Chat",
    "chatType": "poiche",
    "userId": "...",
    "model": "gpt-4o",
    "status": "active",
    "messageCount": 0,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### Get User's Chat Sessions
```http
GET /api/ai/sessions?page=1&limit=20&status=active
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "_id": "...",
      "title": "My Chat Session",
      "messageCount": 5,
      "model": "gpt-4o",
      "tags": [],
      "chatType": "poiche",
      "lastMessageAt": "2025-08-11T10:30:00.000Z",
      "createdAt": "2025-08-11T09:00:00.000Z",
      "updatedAt": "2025-08-11T10:30:00.000Z",
      "id": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

#### Get Specific Chat Session
```http
GET /api/ai/sessions/{sessionId}
Authorization: Bearer <token>
```

#### Update Session Title
```http
PATCH /api/ai/sessions/{sessionId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Chat Title"
}
```

#### Delete Chat Session
```http
DELETE /api/ai/sessions/{sessionId}
Authorization: Bearer <token>
```

### Chat Messages (`/api/ai`)

#### Send Chat Message
```http
POST /api/ai/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "My ex keeps contacting me but has a new girlfriend"
    }
  ],
  "chatType": "poiche",
  "sessionId": "optional-session-id"
}
```

#### Send Streaming Chat Message
```http
POST /api/ai/chat/stream
Authorization: Bearer <token>
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "I want a mirror reading to understand my patterns"
    }
  ],
  "chatType": "miroir_paid",
  "sessionId": "optional-session-id"
}
```

#### Search Messages
```http
GET /api/ai/search?q=relationship&limit=20&sessionId=optional
Authorization: Bearer <token>
```

#### Get Message Statistics
```http
GET /api/ai/stats?days=30
Authorization: Bearer <token>
```

### Subscriptions (`/api`)

#### Stripe Webhook (Internal)
```http
POST /api/stripe/webhook
Content-Type: application/json
Stripe-Signature: <webhook-signature>
```

#### Get Subscription Analytics (Admin)
```http
GET /api/subscription/analytics?days=30
Authorization: Bearer <admin-token>
```

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  email: String,
  name: String,
  role: "free" | "premium_monthly" | "premium_annual" | "admin",
  authProvider: "local" | "google" | "apple" | "github",
  stripeCustomerId: String,
  subscriptionStatus: String,
  monthlyMessageCount: Number,
  isPremium: Boolean, // Virtual field
  preferences: {
    theme: "light" | "dark" | "system",
    language: String,
    emailNotifications: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### ChatSession Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  status: "active" | "archived" | "deleted",
  messageCount: Number,
  lastMessageAt: Date,
  model: String,
  settings: {
    temperature: Number,
    maxTokens: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model
```javascript
{
  _id: ObjectId,
  sessionId: ObjectId,
  userId: ObjectId,
  content: String,
  sender: "user" | "assistant" | "system",
  messageType: "text" | "image" | "file" | "code",
  status: "sending" | "sent" | "delivered" | "error",
  openaiData: {
    model: String,
    tokens: {
      prompt: Number,
      completion: Number,
      total: Number
    },
    responseTime: Number
  },
  order: Number,
  createdAt: Date
}
```

## Rate Limiting

- Free users: 50 messages per month
- Premium users: Unlimited messages
- API rate limit: 100 requests per 15 minutes per IP

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message",
  "details": [] // Optional validation details
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests
- `500` - Internal Server Error

## Chat Types

### Poiche (`poiche`) - Free Tier
Archetype analysis personality - analyzes relationship patterns and provides archetype insights.
- Available to all users
- Identifies toxic patterns through archetype matching
- Provides basic guidance and insights

### Miroir - Premium
Advanced mirror reading mode for deep psychological insights.
- Premium subscription required
- Deep psychological analysis
- Advanced pattern recognition
- Comprehensive life guidance

### Salon de Thé (`salon_de_the`) - Premium
Ritualistic tea salon sessions with guided introspection.
- Premium subscription required
- Structured ritual-based sessions
- Guided meditation and reflection
- Ceremonial approach to problem-solving

## Subscription Tiers

### Free Tier
- 50 messages per month
- Basic chat functionality
- Limited history

### Premium Monthly
- Unlimited messages
- Full chat history
- Priority support
- Advanced features

### Premium Annual
- All Premium Monthly features
- Discounted pricing
- Extended support

## Webhooks

### Stripe Webhooks

The following Stripe events are handled:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Security

- JWT tokens for authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation
- CORS protection
- Helmet security headers

## Database Indexes

The following indexes are automatically created for optimal performance:

**Users Collection:**
- `email` (unique)
- `stripeCustomerId`
- `role, isActive`

**ChatSessions Collection:**
- `userId, status, lastMessageAt`
- `shareToken` (unique, sparse)

**Messages Collection:**
- `sessionId, order`
- `userId, createdAt`

**SubscriptionStatusChanges Collection:**
- `userId, createdAt`
- `stripeEventId` (unique, sparse)

## Environment Variables

Required environment variables:
```bash
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Testing

Use the provided seeder to create test data:
```bash
npm run seed
```

This creates:
- Free user: `free@example.com` (password: `password123`)
- Premium user: `premium@example.com` (password: `password123`)
- Admin user: `admin@example.com` (password: `password123`)
