# API Endpoint Contracts (Specifications)

Below are the strictly typed JSON specifications for all active authentication endpoints.

### 1 POST `/api/auth/register`
Registers a new player with a default starter wallet balance of **10 BDT**.

*   **Request Payload:**
    ```json
    {
      "username": "PlayerOne",
      "email": "player.one@ffairdrop.gg",
      "password": "Password123!"
    }
    ```
*   **Response Payload (`201 Created`):**
    ```json
    {
      "success": true,
      "message": "Account registered successfully.",
      "data": {
        "user": {
          "id": "6648df479b1836109c0bfd91",
          "username": "PlayerOne",
          "email": "player.one@ffairdrop.gg",
          "role": "PLAYER",
          "wallet": {
            "balance": 10,
            "currency": "BDT"
          }
        }
      }
    }
    ```
*   **Error Response Payload (`409 Conflict` - Email in Use):**
    ```json
    {
      "success": false,
      "error": {
        "code": "EMAIL_ALREADY_EXISTS",
        "message": "An account with this email address already exists."
      }
    }
    ```

---

### 2 POST `/api/auth/login`
Authenticates a user and issues dual secure HttpOnly session cookies (Access Token + Refresh Token).

*   **Request Payload:**
    ```json
    {
      "email": "player.one@ffairdrop.gg",
      "password": "Password123!"
    }
    ```
*   **Response Headers:**
    ```http
    Set-Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=900
    Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5c...; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
    Content-Type: application/json
    ```
*   **Response Payload (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Authentication successful. Welcome to ffairdrop!",
      "data": {
        "user": {
          "id": "6648df479b1836109c0bfd91",
          "username": "PlayerOne",
          "email": "player.one@ffairdrop.gg",
          "role": "PLAYER",
          "wallet": {
            "balance": 10,
            "currency": "BDT"
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

### 3 POST `/api/auth/logout`
Securely logs the user out, clearing both session cookies and revoking the refresh token in the database.

*   **Response Headers:**
    ```http
    Set-Cookie: token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0
    Set-Cookie: refreshToken=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0
    Content-Type: application/json
    ```
*   **Response Payload (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Logged out successfully."
    }
    ```

---

### 4 POST `/api/auth/refresh-token`
Rotates the short-lived session access token using a valid, matching, long-lived refresh token. Employs gold-standard Refresh Token Rotation (RTR).

*   **Authentication:** Requires valid `refreshToken` HttpOnly cookie.
*   **Response Headers:**
    ```http
    Set-Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=900
    Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5c...; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
    Content-Type: application/json
    ```
*   **Response Payload (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Access token successfully rotated."
    }
    ```
*   **Error Response Payload (`401 Unauthorized` - Token Expired/Revoked/Replayed):**
    ```json
    {
      "success": false,
      "error": {
        "code": "TOKEN_EXPIRED",
        "message": "Session expired or invalid refresh token. Please log in again."
      }
    }
    ```

---

### 5 POST `/api/auth/forgot-password`
Initiates a secure password reset sequence. Dispatches instructions using user-enumeration mitigations.

*   **Request Payload:**
    ```json
    {
      "email": "player.one@ffairdrop.gg"
    }
    ```
*   **Response Payload (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "If an account is associated with this email, a password reset link has been dispatched."
    }
    ```

---

### 6 POST `/api/auth/reset-password`
Resets a user's password using a valid, non-expired cryptographic token.

*   **Request Payload:**
    ```json
    {
      "token": "40_character_hexadecimal_token_string",
      "password": "NewSecretPassword99!"
    }
    ```
*   **Response Payload (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Password reset successful. You may now log in with your new credentials."
    }
    ```
*   **Error Response Payload (`400 Bad Request` - Expired/Invalid Token):**
    ```json
    {
      "success": false,
      "error": {
        "code": "INVALID_OR_EXPIRED_RESET_TOKEN",
        "message": "The password reset token is invalid, expired, or has already been used."
      }
    }
    ```

---

### 7 GET `/api/auth/me`
Retrieves the profile and wallet balance of the currently authenticated player.

*   **Authentication:** Requires valid access JWT cookie (`token`).
*   **Response Payload (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Active user session profile retrieved successfully.",
      "data": {
        "user": {
          "id": "6648df479b1836109c0bfd91",
          "username": "PlayerOne",
          "email": "player.one@ffairdrop.gg",
          "role": "PLAYER",
          "wallet": {
            "balance": 10,
            "currency": "BDT"
          }
        }
      }
    }
    ```

---