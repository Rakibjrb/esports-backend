# ffairdrop: Esports Tournament Management System
## System Architecture & Technical Planning Document

This document serves as the master execution blueprint and system architecture specification for building **ffairdrop**, a high-performance, secure, and robust Esports Tournament Management System. Subsequent AI execution agents and developers should follow this blueprint strictly to ensure consistent patterns, secure transactions, and clean code division.

---

## 1. Architectural Pattern & Directory Structure

We adopt a **Clean Architecture with Decoupled Services** pattern. The backend leverages a layered design (Routes $\rightarrow$ Middlewares $\rightarrow$ Controllers $\rightarrow$ Services $\rightarrow$ Models/Database) to separate concerns and facilitate mock testing. The frontend utilizes the modern **Next.js App Router** architecture with atomic components, stateful custom hooks, and centralized service layers.

### 1.1 Backend Directory Structure (Node.js + Express.js + TypeScript)

```
esports-backend/
├── src/
│   ├── config/             # Centralized config (DB, Redis, Logger, JWT)
│   │   ├── database.ts     # MongoDB/Mongoose connection with replica set support
│   │   ├── env.ts          # Strictly validated environment variables (using Zod)
│   │   ├── redis.ts        # Redis client initialization for rate-limiting and queues
│   │   └── logger.ts       # Winston/Morgan structured logger setup
│   ├── controllers/        # Express controllers (extract params, call services, format responses)
│   │   ├── auth.controller.ts
│   │   ├── tournament.controller.ts
│   │   ├── transaction.controller.ts
│   │   └── match.controller.ts
│   ├── middlewares/        # Express reusable middlewares
│   │   ├── auth.middleware.ts       # JWT authentication and user injection
│   │   ├── rbac.middleware.ts       # Role-Based Access Control checks
│   │   ├── validation.middleware.ts # express-validator input sanitizers
│   │   └── error.middleware.ts      # Global centralized error handler
│   ├── models/             # Mongoose schemas, types, and document interfaces
│   │   ├── user.model.ts            # User and Wallet Schema
│   │   ├── tournament.model.ts      # Tournament metadata, slots, and rules Schema
│   │   ├── transaction.model.ts     # Ledger system for deposits, entry-fees, and payouts Schema
│   │   └── match.model.ts           # Matches, brackets, and score sheets Schema
│   ├── routes/             # Express API routing tables
│   │   ├── auth.routes.ts
│   │   ├── tournament.routes.ts
│   │   ├── transaction.routes.ts
│   │   └── match.routes.ts
│   ├── services/           # Core domain logic (decoupled from Express req/res)
│   │   ├── auth.service.ts          # Password hashing, token generation
│   │   ├── tournament.service.ts    # Bracket math, team check-ins, atomic joins
│   │   └── transaction.service.ts   # Ledger entries, payment processing
│   ├── jobs/               # Background queue tasks (BullMQ)
│   │   ├── processors/              # Queue consumer worker logic
│   │   └── queues.ts                # Queue publishers (e.g., bracket generation)
│   ├── utils/              # Generic utility functions and custom errors
│   │   ├── errors.ts                # Custom Error classes (AppError, NotFoundError)
│   │   └── constants.ts             # Global constants (Roles, Currencies, Statuses)
│   ├── app.ts              # Express application configuration
│   └── server.ts           # Server entry point, HTTP bootstrap
├── tests/                  # Integration & unit test suites
│   ├── integration/
│   ├── unit/
│   └── setup.ts            # Test environment bootstrap script
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```

### 1.2 Frontend Directory Structure (Next.js App Router + TypeScript)

```
esports-frontend/
├── src/
│   ├── app/                # App Router Page tree
│   │   ├── (auth)/         # Grouped route: authentication flows
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/    # Grouped route: authenticated user views
│   │   │   ├── player/
│   │   │   │   └── page.tsx
│   │   │   ├── moderator/
│   │   │   │   └── page.tsx
│   │   │   └── admin/
│   │   │       └── page.tsx
│   │   ├── tournaments/    # Public tournament browsing and details
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── layout.tsx      # Root layout (provides Redux providers and global nav)
│   │   ├── page.tsx        # Storefront / Landing Page
│   │   └── providers.tsx   # Aggregates Redux Provider and SWR/Query Cache Providers
│   ├── components/         # Modular React Components
│   │   ├── ui/             # Atomic components (Button, Input, Badge, Dialog)
│   │   ├── layout/         # Navigation, Sidebar, Footer components
│   │   └── tournament/     # Domain-specific components (BracketView, ParticipantList)
│   ├── store/              # Redux Toolkit (RTK) Global State Management
│   │   ├── index.ts        # Redux Store configuration and middleware setup
│   │   ├── hooks.ts        # Typed dispatch/selector custom hooks (useAppDispatch, useAppSelector)
│   │   └── slices/         # Slices managing specific domain states
│   │       ├── authSlice.ts        # Active authentication session and user state slice
│   │       ├── tournamentSlice.ts  # Selected tournament, match bracket status, and polling state slice
│   │       └── uiSlice.ts          # Global UI alerts, modals, sidebar visibility slice
│   ├── hooks/              # Reusable custom React hooks
│   │   ├── useAuth.ts      # Connects login/logout actions and authentication state from Redux
│   │   └── useFetch.ts     # Custom wrapper for fetch API
│   ├── services/           # Backend API integration layer
│   │   ├── api.client.ts   # Axios/Fetch custom client with credentials support
│   │   └── endpoints/      # Structured API call functions mapped to endpoints
│   ├── styles/             # Global CSS and theme/tokens mapping
│   │   └── globals.css     # Glassmorphism, animations, and premium color tokens
│   ├── types/              # Domain-specific TypeScript models
│   │   └── index.ts        # Reusable common interfaces
│   └── utils/              # Reusable utility files (formatters, helpers)
│       └── helpers.ts
├── public/                 # Static assets (logos, fallback covers, icons)
├── .env.example
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 2. Step-by-Step Implementation Roadmap

The implementation plan is split into **5 sequential phases**. Each phase focuses on building a functional core block that must pass validation before beginning the next phase.

```
+-----------------------------------+
| Phase 1: Setup & DB Init          |
+-----------------+-----------------+
                  |
                  v
+-----------------+-----------------+
| Phase 2: Auth & Role Control      |
+-----------------+-----------------+
                  |
                  v
+-----------------+-----------------+
| Phase 3: Ledger & Payments        |
+-----------------+-----------------+
                  |
                  v
+-----------------+-----------------+
| Phase 4: Tournament Atomic Engine |
+-----------------+-----------------+
                  |
                  v
+-----------------+-----------------+
| Phase 5: Brackets & Polling Sync  |
+-----------------------------------+
```

### Phase 1: Environment Setup, Database Init & Core Config
*   **What to build first:**
    1. Base TypeScript repositories for backend and frontend.
    2. Strictly typed configuration parser (`src/config/env.ts`) using Zod.
    3. Mongoose connection module with built-in retry-logic, handling replica set parameters.
    4. Centrally structured Winston logger.
*   **What and how to test/verify:**
    *   Verify that database connections fail gracefully on timeout.
    *   Verify environment parser crashes process early with detailed constraint failures if `.env` is incomplete.
    *   Write a basic integration test (`tests/integration/db.test.ts`) that spawns the DB and asserts connection establishment.

### Phase 2: Authentication, Role-Based Access Control (RBAC) & User Management
*   **What to build first:**
    1. `User` schema definition, featuring embedded `wallet` balances and static `role` structures (`PLAYER`, `MODERATOR`, `ADMIN`).
    2. `/api/auth/register` and `/api/auth/login` handlers. Password hashing via `bcrypt`.
    3. JWT issuance helper that writes secure, HTTPOnly, Signed, SameSite cookies.
    4. Route protection middlewares (`authenticateUser`, `authorizeRoles(['ADMIN', 'MODERATOR'])`).
*   **What and how to test/verify:**
    *   Unit tests checking correct hashing of passwords and rejecting weak credentials.
    *   Integration tests verifying JWT signature validation.
    *   Access tests proving that players receive `403 Forbidden` responses when querying administrative routes.

### Phase 3: Ledger, Payments & Transaction Verification Flows
*   **What to build first:**
    1. Core `Transaction` schema to act as a double-entry financial ledger (types: `DEPOSIT`, `WITHDRAWAL`, `ENTRY_FEE`, `PRIZE_PAYOUT`).
    2. Deposit endpoint `/api/payments/deposit` generating a pending transaction with a uniquely identified `txnId`.
    3. Moderator verification dashboard endpoint (`PATCH /api/moderator/transactions/:id`) allowing approvals or rejections of manual deposits, crediting/debiting user wallet balances.
*   **What and how to test/verify:**
    *   Test double-spending and duplicate transaction submissions.
    *   Assert that transitioning a transaction status from `PENDING` to `APPROVED` dynamically increments user balance inside an isolated unit test.
    *   Test validation failures when attempting to update transaction IDs that do not exist or are already settled.

### Phase 4: Tournaments, Atomic Registration Engine & Multi-Player Join Flows
*   **What to build first:**
    1. `Tournament` schema containing status (`UPCOMING`, `ACTIVE`, `COMPLETED`), `entryFee`, `prizePool`, `maxSlots`, and `participants` tracking.
    2. The core atomic endpoint `/api/tournaments/join` wrapping participant addition and balance deduction inside a **MongoDB Session Transaction**.
    3. Built-in concurrency validation (guaranteeing that registration is aborted and wallet balance rolled back if tournament slots fill up mid-transaction).
*   **What and how to test/verify:**
    *   Write concurrency tests executing 100 simultaneous join requests to a 10-slot tournament.
    *   Verify that wallet deductions roll back completely if a player joins a tournament that reaches maximum capacity during execution.
    *   Verify that players with insufficient funds are rejected immediately without acquiring session locks.

### Phase 5: Bracket Generation, Dynamic Polling Sync & Production Polish
*   **What to build first:**
    1. Bracket generation algorithms (Single elimination match scheduling) triggered when tournament status transitions from `UPCOMING` to `ACTIVE`.
    2. Background task runners (using BullMQ) to safely schedule match bracket updates and handle potential high-CPU workloads.
    3. HTTP-based client-side polling sync mechanisms using React Query or SWR to periodically fetch match status and bracket updates from the player screens at optimal intervals (e.g., every 15-30 seconds with exponential backoff on page inactivity).
    4. Next.js dashboard UI styling with customized glassmorphism CSS templates, responsive layouts, and visual status graphs.
*   **What and how to test/verify:**
    *   Assert correctness of bracket generation math for non-power-of-two participant arrays (handling "byes").
    *   Verify request debouncing and query caching to prevent server overload during parallel pulling.
    *   Validate End-to-End browser flow under low-bandwidth simulation.

---

## 3. Security & Edge-Case Audit Matrix

Below is the architectural matrix identifying vulnerabilities, impacts, and the concrete programmatic solutions implemented in ffairdrop.

| Vulnerability ID | Scenario & Edge-Case | Impact | Programmatic Mitigation Strategy | Implementation Details |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-001** | **Race Condition during Tournament Registration**<br><br>Multiple players request to join a tournament at the exact same millisecond. | Slots over-allocated (e.g. 18 players joined a 16-slot limit tournament). User balances debited but no slot is available, creating inconsistency. | Implement MongoDB ACID Transactions with explicit Read/Write session contexts. Query `slotsLeft` and lock documents dynamically inside a session before executing updates. | Use Mongoose `session.withTransaction()` context. Re-verify slots and execute updates atomically inside the session. If `currentParticipants.length >= maxSlots`, abort transaction. |
| **SEC-002** | **Duplicate Transaction ID Submission**<br><br>Malicious player submits the same payment Gateway Transaction ID (`txnId`) multiple times. | Replay attack resulting in double-crediting user wallets for a single actual payment. | Create a **compound unique index** on the database. Combine it with a distributed short-term Redis execution lock. | Mongoose Schema level: `transactionSchema.index({ txnId: 1, gateway: 1 }, { unique: true })`. On API call, lock the `txnId` key in Redis using `NX PX 10000` (10s expiry). |
| **SEC-003** | **Bypassing Access Controls / ID Mutation**<br><br>Players modify request parameters (e.g., changing user IDs in headers or query parameters) to perform actions. | Administrative API access bypass; players manually altering game scores or approving deposits. | Strict JWT extraction from signed HttpOnly cookies. Reject user-supplied IDs from client payloads for operations targeting the authenticated user's profile. | Rely solely on `req.user.id` appended by JWT middleware. Define Role-based Access checking middleware `checkRole(['ADMIN', 'MODERATOR'])` executing strict checks. |
| **SEC-004** | **NoSQL Injection / JSON Parameter Attacks**<br><br>Attacker passes raw MongoDB operators (e.g., `{"username": {"$ne": null}}`) in login fields. | Authentication bypass, exposing unauthorized collections and data leaks. | Input Sanitization and Schema validation. Avoid passing raw request payloads directly into Mongoose operations. | Use `express-validator` to enforce strict schema types. Avoid `User.findOne(req.body)`. Use: `User.findOne({ email: req.body.email })` to discard unexpected operators. |
| **SEC-005** | **Race Condition during Wallet Withdrawal**<br><br>A player triggers two identical withdrawal API requests in parallel. | Double-withdrawal. User drains wallet below zero because both requests read active balance prior to updates. | Execute atomic balance deductions directly inside MongoDB using relative database operations (e.g., `$inc`), coupled with positive-balance pre-conditions. | Write updates with filter query condition: `User.updateOne({ _id: userId, balance: { $gte: withdrawalAmount } }, { $inc: { balance: -withdrawalAmount } })`. Verify `nModified === 1`. |

---

## 4. API Endpoint Contracts (Specifications)

Below are the strictly typed JSON specifications for mission-critical endpoints.

### 4.1 POST `/api/auth/login`
Authenticates a user and issues JWT inside a secure HttpOnly cookie.

*   **Request Payload:**
    ```json
    {
      "email": "player.one@ffairdrop.gg",
      "password": "Password123!"
    }
    ```
*   **Response Headers:**
    ```http
    Set-Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400
    Content-Type: application/json
    ```
*   **Response Payload (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Authentication successful",
      "data": {
        "user": {
          "id": "6648df479b1836109c0bfd91",
          "username": "PlayerOne",
          "email": "player.one@ffairdrop.gg",
          "role": "PLAYER",
          "wallet": {
            "balance": 25000,
            "currency": "USD"
          }
        }
      }
    }
    ```
*   **Error Response Payload (`401 Unauthorized`):**
    ```json
    {
      "success": false,
      "error": {
        "code": "INVALID_CREDENTIALS",
        "message": "The credentials provided do not match our records."
      }
    }
    ```

---

### 4.2 POST `/api/tournaments/join`
Atomic tournament registration endpoint deducting entry fee and listing user.

*   **Authentication:** Requires valid JWT cookie. Role: `PLAYER`.
*   **Request Payload:**
    ```json
    {
      "tournamentId": "6648e0259b1836109c0bfda5"
    }
    ```
*   **Response Payload (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Successfully registered for the tournament.",
      "data": {
        "registrationId": "6648e04b9b1836109c0bfdaf",
        "tournament": {
          "id": "6648e0259b1836109c0bfda5",
          "title": "Ffairdrop Master Cup 2026",
          "slotsFilled": 12,
          "maxSlots": 16
        },
        "wallet": {
          "previousBalance": 25000,
          "currentBalance": 20000,
          "entryFeeDeducted": 5000,
          "currency": "USD"
        }
      }
    }
    ```
*   **Error Response Payload (`409 Conflict` - Tournament Full):**
    ```json
    {
      "success": false,
      "error": {
        "code": "TOURNAMENT_FULL",
        "message": "Registration failed. All tournament slots have been filled."
      }
    }
    ```
*   **Error Response Payload (`402 Payment Required` - Insufficient Funds):**
    ```json
    {
      "success": false,
      "error": {
        "code": "INSUFFICIENT_FUNDS",
        "message": "Registration failed. Wallet balance is insufficient to pay the entry fee of 5000 USD."
      }
    }
    ```

---

### 4.3 PATCH `/api/moderator/transactions/:id`
Allows a Moderator or Admin to approve/reject deposit and withdrawal requests.

*   **Authentication:** Requires valid JWT cookie. Role: `MODERATOR` or `ADMIN`.
*   **URI Path parameter:** `id` represents the MongoDB transaction ObjectId.
*   **Request Payload:**
    ```json
    {
      "status": "APPROVED",
      "reason": "Payment verified via bank gateway receipt ref: #99283."
    }
    ```
*   **Response Payload (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Transaction processing complete. Wallet status updated successfully.",
      "data": {
        "transaction": {
          "id": "6648e11a9b1836109c0bfdb8",
          "userId": "6648df479b1836109c0bfd91",
          "type": "DEPOSIT",
          "amount": 15000,
          "status": "APPROVED",
          "txnId": "GATEWAY-TXN-88231",
          "moderatorNotes": "Payment verified via bank gateway receipt ref: #99283.",
          "processedAt": "2026-05-18T13:10:37.000Z"
        },
        "userWallet": {
          "userId": "6648df479b1836109c0bfd91",
          "updatedBalance": 35000,
          "currency": "USD"
        }
      }
    }
    ```
*   **Error Response Payload (`400 Bad Request` - Already Processed):**
    ```json
    {
      "success": false,
      "error": {
        "code": "TRANSACTION_ALREADY_SETTLED",
        "message": "Cannot modify status. This transaction has already been APPROVED."
      }
    }
    ```

---

## 5. Verification & Testing Strategy

To guarantee the reliability of atomic sessions and financial safety, tests are run locally against an isolated environment mirroring a production environment.

### 5.1 Local Integration Testing Infrastructure

We will utilize **Jest** as our test runner and **Supertest** for making HTTP assertions. The backend routes will be run against a localized database instance to verify database queries and transaction states.

```
                    +-----------------------------+
                    |        Test Suite           |
                    | (Jest + Supertest Runner)   |
                    +--------------+--------------+
                                   |
                     Runs requests | against routes
                                   v
                    +--------------+--------------+
                    |    Express Backend Routes   |
                    |   (With active Middlewares) |
                    +--------------+--------------+
                                   |
                     Performs ACID | sessions & queries
                                   v
                    +--------------+--------------+
                    |  MongoDB In-Memory Replica  |
                    |    Set (Transactions ON)    |
                    +-----------------------------+
```

### 5.2 Local MongoDB Replica Set Setup for Transactions

Because MongoDB ACID transactions **require a Replica Set environment** to execute session operations (such as `session.startTransaction()`), standard standalone local MongoDB instances will fail. 

We resolve this by using `mongodb-memory-server` in the integration test environment or running a local lightweight replica set via Docker Compose:

#### `tests/setup.ts` - Local In-Memory Replica Set Hook:
```typescript
import { MongoMemoryReplicaSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let replSet: MongoMemoryReplicaSet;

export const connectTestDatabase = async () => {
  // Spawn a local in-memory 3-node MongoDB Replica Set
  replSet = await MongoMemoryReplicaSet.create({
    replSet: { storageEngine: 'ephemeralForTest', count: 3 }
  });
  
  const uri = replSet.getUri();
  
  await mongoose.connect(uri, {
    connectTimeoutMS: 5000,
  });
};

export const disconnectTestDatabase = async () => {
  await mongoose.disconnect();
  await replSet.stop();
};
```

---

### 5.3 Concurrency & Race-Condition Test Suite

To prove the tournament registration engine handles race conditions successfully, write an integration test that simulates multiple concurrent users attempting to register.

#### `tests/integration/tournament-concurrency.test.ts`
```typescript
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app';
import User from '../../src/models/user.model';
import Tournament from '../../src/models/tournament.model';
import { connectTestDatabase, disconnectTestDatabase } from '../setup';

describe('Tournament Registration Race Conditions', () => {
  beforeAll(async () => await connectTestDatabase());
  afterAll(async () => await disconnectTestDatabase());

  it('should successfully handle concurrent registrations without exceeding max capacity', async () => {
    // 1. Setup a tournament with only 3 open slots and an entry fee of 50 USD
    const tournament = await Tournament.create({
      title: "Clash of Champions (Atomic Limit Test)",
      entryFee: 50,
      maxSlots: 3,
      participants: [],
      status: "UPCOMING"
    });

    // 2. Create 10 mock users, each with a wallet balance of 100 USD
    const users = [];
    const tokens = [];
    
    for (let i = 0; i < 10; i++) {
      const uniqueUser = await User.create({
        username: `proPlayer_${i}`,
        email: `player_${i}@gmail.com`,
        passwordHash: "hashPasswordVal",
        role: "PLAYER",
        wallet: { balance: 100, currency: "USD" }
      });
      users.push(uniqueUser);
      
      // Simulate JWT creation token
      const mockToken = generateMockToken(uniqueUser);
      tokens.push(mockToken);
    }

    // 3. Fire all 10 registration requests concurrently using Promise.all
    const promises = tokens.map((token) => 
      request(app)
        .post('/api/tournaments/join')
        .set('Cookie', [`token=${token}`])
        .send({ tournamentId: tournament._id.toString() })
    );

    const responses = await Promise.all(promises);

    // 4. Extract statuses from parallel outcomes
    const successfulJoins = responses.filter(res => res.status === 200);
    const rejectedJoins = responses.filter(res => res.status === 409); // Conflict (Full)

    // 5. Hard Assertions
    // Ensure EXACTLY 3 users successfully joined (maxSlots limit)
    expect(successfulJoins.length).toBe(3);
    
    // Ensure the other 7 requests were rejected gracefully
    expect(rejectedJoins.length).toBe(7);

    // 6. Verify Database Invariants
    const updatedTournament = await Tournament.findById(tournament._id);
    expect(updatedTournament?.participants.length).toBe(3);

    // Ensure all 7 rejected players were NOT charged, and their balances remain 100
    const successfulUserIds = successfulJoins.map(res => res.body.data.registrationId); // Assuming matching tracking
    const allDbUsers = await User.find({ _id: { $in: users.map(u => u._id) } });

    let successfulChargeCount = 0;
    let unaffectedRefundCount = 0;

    for (const dbUser of allDbUsers) {
      if (dbUser.wallet.balance === 50) {
        successfulChargeCount++;
      } else if (dbUser.wallet.balance === 100) {
        unaffectedRefundCount++;
      }
    }

    expect(successfulChargeCount).toBe(3);
    expect(unaffectedRefundCount).toBe(7);
  });
});

// Mock helper function for testing environment JWTs
function generateMockToken(user: any): string {
  // Implement a fast token signer mapped to JWT utility
  return require('../../src/services/auth.service').signToken(user._id, user.role);
}
```

---

## 6. Development Integration Directives

For execution agents and developers creating code components based on this blueprint:
1. **Never bypass the Service Layer:** Express routes call controllers, controllers call services, and services interact with schemas.
2. **Mandatory Indexing:** Any schema field that is filtered frequently (`email`, `status`, `txnId`, `tournamentId`) must have explicit indexing at the Mongoose definition level.
3. **HTTP Strict Statuses:**
   * `200 OK` for mutations that return updated entities.
   * `201 Created` for creations.
   * `400 Bad Request` for validator input failures.
   * `401 Unauthorized` for expired/missing cookies.
   * `403 Forbidden` for role clearance checks.
   * `409 Conflict` for state violations (duplicate keys, full tournament).
4. **Log State Transitions:** Ensure all transaction statuses (`PENDING` $\rightarrow$ `APPROVED` | `REJECTED`) write auditable debug structures detailing executing moderator identity.
