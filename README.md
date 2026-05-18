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
│   │   ├── database.ts     # MongoDB/Mongoose connection settings
│   │   ├── env.ts          # Strictly validated environment variables (using Zod)
│   │   ├── logger.ts       # Winston/Morgan structured logger setup
│   │   └── redis.ts        # Redis client initialization for rate-limiting
│   ├── controllers/        # Express controllers (extract params, call services, format responses)
│   │   └── auth.controller.ts       # Registration, login, logout, password resets, token rotation
│   ├── interfaces/         # Centralized TypeScript interface structures
│   │   ├── auth.interface.ts        # JWT token payload signatures
│   │   └── user.interface.ts        # Player entity models & wallet fields
│   ├── middlewares/        # Express reusable middlewares
│   │   ├── auth.middleware.ts       # JWT authentication and user injection
│   │   ├── rbac.middleware.ts       # Role-Based Access Control checks
│   │   ├── validation.middleware.ts # Input validation handler
│   │   └── error.middleware.ts      # Global centralized JSON exception handler
│   ├── routes/             # Express API routing tables
│   │   └── auth.routes.ts           # Authentication & token endpoints
│   ├── schemas/            # Database storage schemas (Mongoose)
│   │   └── user.schema.ts           # Player database attributes & hooks
│   ├── services/           # Decoupled core business domain logic layers
│   │   └── auth.service.ts          # Password cryptography, login validations, session builders
│   ├── smtp/               # Operational mailing infrastructure (Nodemailer)
│   │   └── mailer.ts                # Premium esports-themed responsive HTML template dispatch
│   ├── utils/              # Generic utility functions and custom errors
│   │   ├── errors.ts                # Custom Error classes (AppError, NotFoundError, UnauthorizedError)
│   │   └── sendResponse.ts          # Standardized JSend response formatter
│   ├── validators/         # Input schema validation pipelines
│   │   └── auth.validator.ts        # Express validators for register/login/forgot/reset fields
│   ├── app.ts              # Express application configuration
│   └── server.ts           # Server entry point, HTTP bootstrap
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```

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
```

### Phase 1: Environment Setup, Database Init & Core Config
*   **What to build first:**
    1. Base TypeScript repositories for backend and frontend.
    2. Strictly typed configuration parser (`src/config/env.ts`) using Zod.
    3. Mongoose connection module with built-in retry-logic, handling replica set parameters.
    4. Centrally structured Winston logger.

### Phase 2: Authentication, Role-Based Access Control (RBAC) & User Management
*   **What to build first:**
    1. `User` schema definition, featuring embedded `wallet` balances (default 10 BDT) and static `role` structures (`PLAYER`, `MODERATOR`, `ADMIN`).
    2. Secure authentication pipeline registering and verifying users:
       * `POST /api/auth/register` (Password hashing via `bcrypt`)
       * `POST /api/auth/login` (Dual Access + Refresh tokens)
       * `POST /api/auth/logout` (Cookie clearing and token database revocation)
       * `POST /api/auth/refresh-token` (Refresh Token Rotation)
       * `POST /api/auth/forgot-password` (SMTP mock password reset email dispatcher)
       * `POST /api/auth/reset-password` (Secure credential overrides)
       * `GET /api/auth/me` (Active player profile query)
    3. Route protection middlewares (`authenticateUser`, `authorizeRoles(['ADMIN', 'MODERATOR'])`).

---

# Development Integration Directives

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
