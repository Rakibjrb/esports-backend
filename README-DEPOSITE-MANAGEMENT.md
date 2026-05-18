# 💎 ffairdrop: Wallet Ledger & Manual Gateway Management Specs

This documentation details the system specifications, data architecture, security checks, and endpoints for **Phase 3: Wallet Ledger, Ingestion, & Moderator Manual Gateways**.

---

## 📂 Core File Registry (Directory Layout)

```
esports-backend/src/
├── interfaces/
│   └── transaction.interface.ts     # TypeScript enum types & ITransaction fields
├── schemas/
│   └── transaction.schema.ts        # Database model, indexes, and duplicate constraints
├── validators/
│   └── transaction.validator.ts     # express-validator payload sanitizers
├── services/
│   └── transaction.service.ts       # Ingestion & atomic session processing
├── controllers/
│   └── transaction.controller.ts    # Input mapping & unified JSend formatter
├── routes/
│   ├── transaction.routes.ts        # Player wallet endpoints router
│   └── moderator/
│       └── transaction.routes.ts    # Isolated moderator review endpoints router
└── app.ts                           # Server pipeline mount point
```

---

## ⚡ Technical Architecture Details

### 1. Ingestion & Duplicate Immunity
When players submit a deposit via bKash, Nagad, or Rocket, they register the external gateway metadata and a unique reference string (`txnId`).
- To completely block replay and double-spending attempts, we enforce a **Compound Unique Index** at the database collection level on `{ txnId: 1, gateway: 1 }`.
- Any attempt to submit the same transaction reference for the same gateway will immediately crash the call with a `409 Conflict` (Duplicate Key violation).

### 2. ACID Transaction Session & Standalone Fallback
Manual payments are verified and settled by moderators. To guarantee 100% data consistency (preventing a state where a transaction is marked as approved but the player's wallet balance fails to increment), the status updates and balance increments run in a single atomic pipeline:
- **Replica Sets / Clusters**: Operates inside a native **MongoDB session transaction**. Either both operations succeed together, or the session aborts and rolls back completely.
- **Local Standalone Fallback**: If the local development machine uses a standalone MongoDB setup without replica sets enabled, the service automatically detects illegal session operations and executes a fallback atomic Mongoose routine, preserving local developer velocity without breaking backend integrity.

---

## 📋 Interface & Types definition

```typescript
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'ENTRY_FEE' | 'PRIZE_PAYOUT';
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PaymentGateway = 'BKASH' | 'NAGAD' | 'ROCKET';
```

---

## 📡 API Endpoint Contracts (JSend Specifications)

### 1. POST `/api/wallet/deposit`
Submits a pending top-up verification request. Available to authenticated `PLAYER` sessions.

*   **Request Payload:**
    ```json
    {
      "amount": 500,
      "gateway": "BKASH",
      "txnId": "TRX99283741"
    }
    ```
*   **Response Payload (`201 Created`):**
    ```json
    {
      "success": true,
      "message": "Deposit verification request submitted successfully.",
      "data": {
        "transaction": {
          "_id": "6648e11a9b1836109c0bfdb8",
          "userId": "6648df479b1836109c0bfd91",
          "type": "DEPOSIT",
          "amount": 500,
          "status": "PENDING",
          "gateway": "BKASH",
          "txnId": "TRX99283741",
          "createdAt": "2026-05-19T00:58:12.000Z"
        }
      }
    }
    ```
*   **Error Response Payload (`409 Conflict` - Replay Submission):**
    ```json
    {
      "success": false,
      "error": {
        "code": "DUPLICATE_TRANSACTION_ID",
        "message": "This transaction ID reference has already been submitted for verification on this gateway."
      }
    }
    ```

---

### 2. GET `/api/moderator/transactions`
Retrieves all historical and pending ledger listings. Restricted to `MODERATOR` and `ADMIN` role sessions.
*   **Query Parameters (Optional Filters):** `status` (PENDING/APPROVED/REJECTED), `type` (DEPOSIT/WITHDRAWAL), `gateway` (BKASH/NAGAD/ROCKET)

*   **Response Payload (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Transactions ledger list retrieved successfully.",
      "data": {
        "transactions": [
          {
            "_id": "6648e11a9b1836109c0bfdb8",
            "userId": {
              "_id": "6648df479b1836109c0bfd91",
              "username": "PlayerOne",
              "email": "player.one@ffairdrop.gg",
              "role": "PLAYER"
            },
            "type": "DEPOSIT",
            "amount": 500,
            "status": "PENDING",
            "gateway": "BKASH",
            "txnId": "TRX99283741",
            "createdAt": "2026-05-19T00:58:12.000Z"
          }
        ]
      }
    }
    ```

---

### 3. PATCH `/api/moderator/transactions/:id`
Settles a pending user top-up request. Restricted to `MODERATOR` and `ADMIN` role sessions.

*   **Request Payload:**
    ```json
    {
      "status": "APPROVED",
      "reason": "Payment successfully matched on bKash merchant ledger."
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
          "amount": 500,
          "status": "APPROVED",
          "txnId": "TRX99283741",
          "gateway": "BKASH",
          "moderatorNotes": "Payment successfully matched on bKash merchant ledger.",
          "processedAt": "2026-05-19T00:59:45.000Z"
        },
        "userWallet": {
          "userId": "6648df479b1836109c0bfd91",
          "updatedBalance": 510,
          "currency": "BDT"
        }
      }
    }
    ```
