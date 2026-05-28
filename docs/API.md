# GreenQuote API Reference

Base URL: `http://localhost:3000`

All endpoints return JSON. Success responses wrap data in `{ "data": ... }`.
Error responses return `{ "error": "..." }` or `{ "error": { field: [...] } }` for validation errors.

---

## Health

### `GET /api/health`

Liveness probe. No auth required.

**Response 200**
```json
{
  "data": {
    "status": "ok",
    "timestamp": "2024-06-01T12:00:00.000Z",
    "db": "connected"
  }
}
```

---

## Auth

### `POST /api/auth/register`

Create a new user account and issue a session cookie.

**Request body**
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass1"
}
```

| Field    | Type   | Rules                                        |
|----------|--------|----------------------------------------------|
| fullName | string | min 2, max 100 chars                         |
| email    | string | valid email                                  |
| password | string | min 8 chars, ≥1 uppercase, ≥1 digit         |

**Response 201** — Sets `gq_token` httpOnly cookie.
```json
{
  "data": {
    "id": "clx...",
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "role": "USER"
  }
}
```

**Errors** — 409 email already registered, 422 validation.

---

### `POST /api/auth/login`

Authenticate and issue a session cookie.

**Request body**
```json
{ "email": "jane@example.com", "password": "SecurePass1" }
```

**Response 200** — Sets `gq_token` httpOnly cookie.
```json
{ "data": { "id": "clx...", "fullName": "Jane Doe", "email": "jane@example.com", "role": "USER" } }
```

**Errors** — 401 invalid credentials.

---

### `POST /api/auth/logout`

Clear the session cookie.

**Response 200**
```json
{ "data": { "message": "Logged out" } }
```

---

### `GET /api/auth/me`

Return the currently authenticated user. **Auth required.**

**Response 200**
```json
{ "data": { "id": "clx...", "fullName": "Jane Doe", "email": "jane@example.com", "role": "USER" } }
```

**Errors** — 401 not authenticated or session expired (cookie present but user no longer exists in DB).

---

## Quotes

### `POST /api/quotes`

Create a quote and compute financing pre-qualification. **Auth required.**

**Request body**
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "address": "42 Sunny Road, Berlin",
  "monthlyConsumptionKwh": 350,
  "systemSizeKw": 5.5,
  "downPayment": 1000
}
```

| Field                 | Type   | Required | Rules                       |
|-----------------------|--------|----------|-----------------------------|
| fullName              | string | yes      | min 2, max 100              |
| email                 | string | yes      | valid email                 |
| address               | string | yes      | min 5, max 255              |
| monthlyConsumptionKwh | number | yes      | > 0, max 10,000            |
| systemSizeKw          | number | yes      | > 0, max 1,000             |
| downPayment           | number | no       | ≥ 0, default 0             |

**Response 201**
```json
{
  "data": {
    "id": "clx...",
    "userId": "clx...",
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "address": "42 Sunny Road, Berlin",
    "monthlyConsumptionKwh": 350,
    "systemSizeKw": 5.5,
    "downPayment": 1000,
    "systemPrice": 6600,
    "principalAmount": 5600,
    "riskBand": "B",
    "offers": [
      { "termYears": 5,  "apr": 0.089, "principalUsed": 5600, "monthlyPayment": 116.12 },
      { "termYears": 10, "apr": 0.089, "principalUsed": 5600, "monthlyPayment": 70.48 },
      { "termYears": 15, "apr": 0.089, "principalUsed": 5600, "monthlyPayment": 56.64 }
    ],
    "createdAt": "2024-06-01T12:00:00.000Z"
  }
}
```

**Errors** — 401 not authenticated, 422 validation.

---

### `GET /api/quotes`

List quotes. **Auth required.**

- Without `?all=true`, every caller (including admins) sees **only their own quotes**.
- With `?all=true` (admin only), returns every quote in the system with optional `?search=` filtering.

**Query parameters**

| Param  | Type    | Description                                               |
|--------|---------|-----------------------------------------------------------|
| all    | boolean | Set to `true` to fetch all users' quotes (admin only)    |
| search | string  | Filter by user name or email — only valid with `?all=true` |

**Response 200**
```json
{ "data": [ { ...quote }, ... ] }
```

**Errors** — 401 not authenticated, 403 non-admin requested `?all=true`.

---

### `GET /api/quotes/:id`

Fetch a single quote. **Auth required.** Users can only access their own quotes; admins can access any.

**Response 200** — Same shape as POST response.

**Errors** — 400 invalid ID, 401 not authenticated, 403 not owner, 404 not found.

---

### `GET /api/quotes/:id/pdf`

Generate and download a PDF pre-qualification document. **Auth required.** Users can only access their own quotes; admins can access any.

**Response 200** — Binary PDF stream.

| Header               | Value                                    |
|----------------------|------------------------------------------|
| Content-Type         | `application/pdf`                        |
| Content-Disposition  | `attachment; filename="greenquote-<id8>.pdf"` |

**Errors** — 400 invalid ID, 401 not authenticated, 403 not owner, 404 not found.

---

## Pricing Model

```
systemPrice     = systemSizeKw × 1200  (EUR)
principalAmount = systemPrice − downPayment

riskBand:
  A  →  monthlyConsumptionKwh ≥ 400 AND systemSizeKw ≤ 6
  B  →  monthlyConsumptionKwh ≥ 250 (and not A)
  C  →  otherwise

APR:  A → 6.9%,  B → 8.9%,  C → 11.9%

monthlyPayment = P × [r(1+r)^n] / [(1+r)^n − 1]
  r = annualAPR / 12,  n = termYears × 12
```
