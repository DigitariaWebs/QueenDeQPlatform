# 👑 Queen de Q Platform - Complete Backend Testing Guide

This comprehensive guide covers testing EVERY aspect of the Queen de Q Platform backend, including all endpoints, scripts, chat modes, and database operations.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Testing](#database-testing)
4. [Scripts Testing](#scripts-testing)
5. [API Endpoints Testing](#api-endpoints-testing)
6. [Chat System Testing](#chat-system-testing)
7. [Authentication Testing](#authentication-testing)
8. [Subscription System Testing](#subscription-system-testing)
9. [Error Handling Testing](#error-handling-testing)
10. [Performance Testing](#performance-testing)

---

## 🔧 Prerequisites

### Required Tools
- **Postman** - For API endpoint testing
- **Node.js v22+** - Runtime environment
- **MongoDB Compass** (optional) - Database GUI
- **Stripe CLI** (optional) - For webhook testing

### Environment Variables
Ensure these are set in your `.env` file:
```bash
# Database
MONGODB_URI=mongodb+srv://...
DB_NAME=QueenDeQPlatform

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe (for subscription testing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🗄️ Database Testing

### 1. Connection Test
```bash
cd backend
node scripts/testConnection.js
```

**Expected Output**: ✅ Connection successful with database details

### 2. Seeder Test
```bash
node scripts/testSeeder.js
```

**What it tests**:
- User creation with French roles (Court/Diademe/Couronne)
- Chat session creation
- Message insertion
- Subscription status changes

**Expected Output**: ✅ All test data created successfully

### 3. Manual Database Verification
1. Open MongoDB Compass
2. Connect to your database
3. Verify collections exist:
   - `users` - Should have test users with different roles
   - `chatsessions` - Should have sample chat sessions
   - `messages` - Should have test messages
   - `subscriptionstatuschanges` - Should have status change logs

---

## 🛠️ Scripts Testing

### 1. Chat Functionality Tests

#### Test Reine-Mère Chat Only
```bash
node scripts/test-chat.js
```

**What it tests**:
- Basic chat functionality
- Message persistence
- Session creation
- AI response generation

#### Test Poiche (Archetype Selection) Only
```bash
node scripts/test-poihe-only.js
```

**What it tests**:
- Archetype selection system
- Portrait rendering
- Special Poiche AI responses

#### Test Both Chat Modes
```bash
node scripts/test-both-chats.js
```

**What it tests**:
- Switching between Reine-Mère and Poiche
- Session isolation
- Different AI personalities

#### Test Ritual Check
```bash
node scripts/test-ritual-check.js
```

**What it tests**:
- Special ritual/ceremony functionality
- Custom AI responses for rituals

### 2. Expected Script Outputs

All scripts should show:
- ✅ Database connection successful
- ✅ User authentication working
- ✅ Chat session created
- ✅ AI response received
- ✅ Messages saved to database
- ⏱️ Response times (should be < 10 seconds)

---

## 🌐 API Endpoints Testing

### Postman Setup

1. **Create New Collection**: "Queen de Q API Tests"
2. **Set Base URL Variable**: `{{baseUrl}}` = `http://localhost:5000`
3. **Create Environment**: "Local Development"

### Base Variables for Postman
```json
{
  "baseUrl": "http://localhost:5000",
  "authToken": "{{token}}",
  "userId": "{{testUserId}}"
}
```

---

## 📡 Info/Health Endpoints

### 1. Health Check
```http
GET {{baseUrl}}/api/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "message": "Queen de Q Chat Backend is running! 👑",
  "timestamp": "2025-08-10T12:00:00.000Z",
  "version": "1.0.0",
  "features": ["OpenAI Chat", "Streaming", "Multiple Personas"]
}
```

### 2. API Root
```http
GET {{baseUrl}}/api/
```

**Expected Response**:
```json
{
  "message": "👑 Queen de Q Chat API",
  "endpoints": {
    "health": "/api/health",
    "chat": "/api/ai/chat",
    "stream": "/api/ai/chat/stream",
    "modes": "/api/ai/modes"
  }
}
```

---

## 🔐 Authentication Testing

### 1. User Registration

#### Valid Registration
```http
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "email": "test@queendeq.com",
  "password": "password123",
  "name": "Test User"
}
```

**Expected Response (201)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "email": "test@queendeq.com",
    "name": "Test User",
    "role": "Court",
    "isPremium": false,
    "createdAt": "..."
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Invalid Registration Tests
```http
# Missing email
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "password": "password123",
  "name": "Test User"
}
```

**Expected Response (400)**: Validation error

```http
# Duplicate email
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "email": "test@queendeq.com",
  "password": "password123",
  "name": "Another User"
}
```

**Expected Response (409)**: User already exists

### 2. User Login

#### Valid Login
```http
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "test@queendeq.com",
  "password": "password123"
}
```

**Expected Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "...",
    "email": "test@queendeq.com",
    "name": "Test User",
    "role": "Court",
    "isPremium": false,
    "avatar": null,
    "preferences": {},
    "lastLoginAt": "..."
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

⚠️ **Save the token** for subsequent requests!

#### Invalid Login Tests
```http
# Wrong password
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "test@queendeq.com",
  "password": "wrongpassword"
}
```

**Expected Response (401)**: Invalid credentials

### 3. Get Current User
```http
GET {{baseUrl}}/api/auth/me
Authorization: Bearer {{authToken}}
```

**Expected Response (200)**: User profile data

### 4. Update Profile
```http
PATCH {{baseUrl}}/api/auth/me
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "name": "Updated Name",
  "preferences": {
    "theme": "dark",
    "language": "fr"
  }
}
```

**Expected Response (200)**: Updated user data

### 5. Change Password
```http
POST {{baseUrl}}/api/auth/change-password
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

**Expected Response (200)**: Success message

### 6. Logout
```http
POST {{baseUrl}}/api/auth/logout
Authorization: Bearer {{authToken}}
```

**Expected Response (200)**: Logout confirmation

---

## 💬 Chat System Testing

### Chat Types Overview

The platform supports three different chat types:

- **`poiche`** (Free): Basic archetype identification and guidance
- **`miroir`** (Premium): Advanced mirror reading and deep psychological insights  
- **`salon_de_the`** (Premium): Ritualistic tea salon sessions with guided introspection

All chat types maintain conversation history through sessions and support both standard and streaming responses.

### 1. Create Chat Session
```http
POST {{baseUrl}}/api/ai/sessions
Authorization: Bearer {{authToken}}
x-user-id: {{userId}}
Content-Type: application/json

{
  "title": "Test Chat Session",
  "chatType": "poiche"
}
```

**Available Chat Types**:
- `poiche`: Free chat with archetype selection
- `miroir`: Premium mirror reading mode  
- `salon_de_the`: Premium tea salon ritual mode

**Expected Response (200)**:
```json
{
  "success": true,
  "session": {
    "_id": "...",
    "title": "Test Chat Session",
    "userId": "...",
    "chatType": "poiche",
    "model": "gpt-4o",
    "status": "active",
    "messageCount": 0,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

⚠️ **Save the session ID** for chat tests!

### 2. Get User Sessions
```http
GET {{baseUrl}}/api/ai/sessions?page=1&limit=10&status=active
Authorization: Bearer {{authToken}}
x-user-id: {{userId}}
```

**Expected Response (200)**:
```json
{
  "success": true,
  "sessions": [
    {
      "_id": "6898e419a82f632afddd6864",
      "title": "Second Test Chat Session",
      "messageCount": 0,
      "model": "gpt-4o",
      "tags": [],
      "chatType": "poiche",
      "lastMessageAt": "2025-08-10T18:25:29.550Z",
      "createdAt": "2025-08-10T18:25:29.553Z",
      "updatedAt": "2025-08-10T18:25:29.553Z",
      "id": "6898e419a82f632afddd6864"
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

**Chat Types Available**:
- `poiche`: Free chat with archetype selection
- `miroir`: Premium mirror reading mode
- `salon_de_the`: Premium tea salon ritual mode

### 3. Get Specific Session with Messages
```http
GET {{baseUrl}}/api/ai/sessions/{{sessionId}}
Authorization: Bearer {{authToken}}
x-user-id: {{userId}}
```

**Expected Response (200)**: Session with populated messages

### 4. Standard Chat (Poiche Mode - Free)

#### First Message (Creates New Session)
```http
POST {{baseUrl}}/api/ai/chat
Authorization: Bearer {{authToken}}
x-user-id: {{userId}}
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "Mon ex continue de me contacter mais il a une nouvelle copine. Il dit qu'il m'aime encore mais refuse de la quitter."
    }
  ],
  "chatType": "poiche"
}
```

**Expected Response (200)**:
```json
{
  "success": true,
  "message": {
    "role": "assistant",
    "content": "Je vais t'aider à identifier l'archétype de ton ex...",
    "timestamp": "..."
  },
  "sessionId": "...",
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 100,
    "total_tokens": 150
  },
  "selectionName": "Le Manipulateur Émotionnel",
  "archetype": {
    "nom": "Le Manipulateur Émotionnel",
    "famille": "Manipulateurs",
    "...": "..."
  }
}
```

#### Continuing Conversation
```http
POST {{baseUrl}}/api/ai/chat
Authorization: Bearer {{authToken}}
x-user-id: {{userId}}
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "Mon ex continue de me contacter mais il a une nouvelle copine."
    },
    {
      "role": "assistant", 
      "content": "Je vais t'aider à identifier l'archétype de ton ex..."
    },
    {
      "role": "user",
      "content": "Dis-moi en plus sur cet archétype."
    }
  ],
  "sessionId": "{{sessionId}}",
  "chatType": "poiche"
}
```

### 5. Premium Chat (Miroir Mode)
```http
POST {{baseUrl}}/api/ai/chat
Authorization: Bearer {{authToken}}
x-user-id: {{userId}}
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "Je veux faire une lecture miroir pour comprendre ce que mon comportement révèle sur moi."
    }
  ],
  "chatType": "miroir"
}
```

### 6. Premium Chat (Salon de Thé Mode)
```http
POST {{baseUrl}}/api/ai/chat
Authorization: Bearer {{authToken}}
x-user-id: {{userId}}
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "J'aimerais participer à un rituel de salon de thé pour clarifier ma situation."
    }
  ],
  "chatType": "salon_de_the"
}
```

### 7. Streaming Chat
```http
POST {{baseUrl}}/api/ai/chat/stream
Authorization: Bearer {{authToken}}
x-user-id: {{userId}}
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "Aide-moi à comprendre pourquoi je choisis toujours le même type de partenaire toxique."
    }
  ],
  "chatType": "miroir"
}
```

**Expected Response**: Stream of JSON chunks:
```json
{"type":"chunk","content":"Ma","sessionId":"...","timestamp":"..."}
{"type":"chunk","content":" chère","sessionId":"...","timestamp":"..."}
{"type":"chunk","content":" âme","sessionId":"...","timestamp":"..."}
...
{"type":"complete","fullMessage":"...","sessionId":"...","timestamp":"..."}
```

### 7. Update Session Title
```http
PATCH {{baseUrl}}/api/ai/sessions/{{sessionId}}
Authorization: Bearer {{authToken}}
x-user-id: {{userId}}
Content-Type: application/json

{
  "title": "Updated Session Title"
}
```

### 8. Delete Session
```http
DELETE {{baseUrl}}/api/ai/sessions/{{sessionId}}
Authorization: Bearer {{authToken}}
x-user-id: {{userId}}
```

### 9. Search Messages
```http
GET {{baseUrl}}/api/ai/search?q=relationship&limit=10
Authorization: Bearer {{authToken}}
x-user-id: {{userId}}
```

### 10. Get Chat Statistics
```http
GET {{baseUrl}}/api/ai/stats?days=30
Authorization: Bearer {{authToken}}
x-user-id: {{userId}}
```

**Expected Response (200)**:
```json
{
  "success": true,
  "stats": {
    "totalMessages": 150,
    "totalSessions": 25,
    "averageMessagesPerSession": 6,
    "dailyStats": [...]
  },
  "user": {
    "role": "Court",
    "isPremium": false
  }
}
```

---

## 💳 Subscription System Testing

### 1. Get Subscription Analytics (Admin Only)
```http
GET {{baseUrl}}/api/subscription/analytics?days=30
Authorization: Bearer {{adminToken}}
```

**Expected Response (200)**:
```json
{
  "success": true,
  "analytics": {
    "changes": [
      {
        "_id": "stripe_webhook",
        "count": 10,
        "totalRevenue": 29900
      }
    ],
    "userDistribution": [
      {
        "_id": "Court",
        "count": 100
      },
      {
        "_id": "Diademe", 
        "count": 25
      },
      {
        "_id": "Couronne",
        "count": 5
      }
    ]
  }
}
```

### 2. Manual User Upgrade (Admin Only)
```http
POST {{baseUrl}}/api/subscription/manual-upgrade
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "userId": "{{testUserId}}",
  "newRole": "Diademe",
  "notes": "Customer service upgrade"
}
```

### 3. Stripe Webhook Test
```http
POST {{baseUrl}}/api/subscription/stripe/webhook
Content-Type: application/json
Stripe-Signature: your-stripe-signature

{
  "id": "evt_test_123",
  "type": "customer.subscription.created",
  "data": {
    "object": {
      "id": "sub_123",
      "customer": "cus_123",
      "status": "active",
      "current_period_start": 1625097600,
      "current_period_end": 1627776000,
      "items": {
        "data": [
          {
            "price": {
              "id": "price_monthly",
              "recurring": {
                "interval": "month"
              },
              "unit_amount": 2990
            }
          }
        ]
      }
    }
  }
}
```

---

## 🚨 Error Handling Testing

### 1. Invalid Authentication
```http
GET {{baseUrl}}/api/ai/sessions
Authorization: Bearer invalid-token
```

**Expected Response (401)**: Invalid token error

### 2. Missing Required Fields
```http
POST {{baseUrl}}/api/ai/chat
Authorization: Bearer {{authToken}}
x-user-id: {{userId}}
Content-Type: application/json

{
  "messages": []
}
```

**Expected Response (400)**: Validation error

### 3. Invalid Session ID
```http
GET {{baseUrl}}/api/ai/sessions/invalid-id
Authorization: Bearer {{authToken}}
x-user-id: {{userId}}
```

**Expected Response (404)**: Session not found

### 4. Rate Limiting (if implemented)
Send 100+ requests rapidly to test rate limiting.

### 5. Large Payload Test
```http
POST {{baseUrl}}/api/ai/chat
Authorization: Bearer {{authToken}}
x-user-id: {{userId}}
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "Very long message with 10000+ characters..."
    }
  ]
}
```

---

## ⚡ Performance Testing

### 1. Response Time Tests
- **Health check**: Should be < 100ms
- **Authentication**: Should be < 500ms  
- **Chat responses**: Should be < 10 seconds
- **Streaming**: First chunk < 2 seconds

### 2. Concurrent Users Test
Use Postman Runner or artillery.js to simulate:
- 10 concurrent users chatting
- 50 concurrent sessions created
- 100 concurrent health checks

### 3. Database Performance
```bash
# MongoDB performance test
node -e "
const mongoose = require('mongoose');
console.time('DB Connection');
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.timeEnd('DB Connection');
  process.exit();
});
"
```

---

## 📊 Testing Checklist

### ✅ Database & Scripts
- [ ] Database connection successful
- [ ] All test scripts run without errors
- [ ] Test data created correctly
- [ ] Collections populated with sample data

### ✅ Authentication System
- [ ] User registration works (valid/invalid)
- [ ] User login works (valid/invalid)
- [ ] JWT tokens generated correctly
- [ ] Protected routes require authentication
- [ ] Profile updates work
- [ ] Password changes work

### ✅ Chat System
- [ ] Session creation/management works
- [ ] Reine-Mère chat mode works
- [ ] Poiche archetype selection works
- [ ] Streaming chat works
- [ ] Message persistence works
- [ ] Search functionality works
- [ ] Statistics generation works

### ✅ Subscription System
- [ ] Webhook processing works
- [ ] Role upgrades/downgrades work
- [ ] Analytics data correct
- [ ] Manual admin upgrades work

### ✅ Error Handling
- [ ] Invalid requests return proper errors
- [ ] Authentication errors handled
- [ ] Database errors handled gracefully
- [ ] API rate limiting works (if implemented)

### ✅ Performance
- [ ] Response times within acceptable limits
- [ ] Concurrent requests handled properly
- [ ] No memory leaks during extended testing
- [ ] Database queries optimized

---

## 🐛 Common Issues & Solutions

### Issue: "MongoDB connection failed"
**Solution**: Check `MONGODB_URI` in `.env` file

### Issue: "OpenAI API error"
**Solution**: Verify `OPENAI_API_KEY` is valid and has credits

### Issue: "JWT token invalid"
**Solution**: Regenerate token via login endpoint

### Issue: "Chat responses empty"
**Solution**: Check OpenAI API key and model availability

### Issue: "Archetype selection not working"
**Solution**: Verify archetype data files are loaded correctly

---

## 📞 Support & Debugging

### Logs to Check
```bash
# Start server with detailed logging
DEBUG=* npm start

# Check specific logs
tail -f logs/error.log
tail -f logs/chat.log
```

### Database Debugging
```bash
# Connect to MongoDB shell
mongosh "mongodb+srv://..."

# Check collections
use QueenDeQPlatform
db.users.countDocuments()
db.chatsessions.countDocuments()
db.messages.countDocuments()
```

### API Debugging
```bash
# Test with curl
curl -X GET http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'
```

---

## 🎯 Advanced Testing Scenarios

### 1. Role-Based Access Testing
Test that users with different roles (Court/Diademe/Couronne) have appropriate access levels.

### 2. Session Isolation Testing  
Ensure users can only access their own chat sessions and messages.

### 3. Data Integrity Testing
Verify that all database operations maintain referential integrity.

### 4. Security Testing
Test for common vulnerabilities (SQL injection, XSS, CSRF).

### 5. Load Testing
Simulate high traffic to identify bottlenecks.

---

## 📝 Test Results Documentation

Create a test report documenting:
- ✅ Passed tests
- ❌ Failed tests  
- ⚠️ Performance issues
- 🔧 Required fixes
- 📈 Performance metrics

---

**Happy Testing! 👑🧪**

Remember: Testing is the crown that ensures your Queen de Q Platform reigns supreme! Test thoroughly and your users will have a royal experience.
