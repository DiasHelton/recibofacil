# Recibo Fácil — Architecture SPEC

## Overview

MVP for managing personal loans with installment tracking, payment recording,
digitally signed receipts, and an audit trail. Users are identified by name or
nickname; access is protected by email + password. Receipts are rendered on
demand as HTML — no PDFs are generated or stored.

---

## Project Structure

```
recibofacil/
├── README.md
├── SPEC.md                          # This document
├── docker-compose.yml               # Orchestration (PostgreSQL + API + Web)
├── .env.example                     # Environment variable reference
├── .gitignore
│
├── backend/                         # Django REST Framework API
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── config/                      # Django project configuration
│   │   ├── __init__.py
│   │   ├── settings.py              # Single-file settings (DEV default)
│   │   ├── urls.py                  # Root URL conf (admin + api/)
│   │   └── wsgi.py
│   └── core/                        # Main Django app
│       ├── __init__.py
│       ├── apps.py
│       ├── admin.py
│       ├── urls.py                  # API route definitions
│       ├── models/                  # Split models package
│       │   ├── __init__.py
│       │   ├── user.py              # Custom User model
│       │   ├── loan.py              # Loan + Installment
│       │   ├── payment.py           # Payment
│       │   ├── receipt.py           # Receipt + Signature
│       │   ├── attachment.py        # Loan attachment
│       │   ├── audit.py             # AuditLog
│       │   └── notification.py      # Notification
│       ├── serializers/             # DRF serializers package
│       │   ├── __init__.py
│       │   └── serializers.py
│       ├── views/                   # View logic split by domain
│       │   ├── __init__.py
│       │   ├── auth.py              # Registration
│       │   ├── dashboard.py         # Dashboard summary
│       │   ├── loans.py             # Loan CRUD + payment
│       │   ├── payments.py          # Payment list
│       │   └── receipts.py          # Receipt list + sign + document + cancel
│       ├── services/                # Business logic layer
│       │   ├── __init__.py
│       │   ├── audit.py             # Audit logging helper
│       │   └── receipts.py          # Receipt finalization + HTML rendering
│       ├── migrations/
│       │   └── __init__.py
│       └── tests/
│           └── __init__.py
│
└── frontend/                        # React + Vite + TypeScript SPA
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx                 # Entry point
        ├── App.tsx                  # Root component (auth gating)
        ├── style.css                # Global styles
        ├── api/                     # HTTP client layer
        │   ├── client.ts            # Fetch wrapper with JWT injection
        │   └── auth.ts              # Auth API calls
        ├── types/
        │   └── index.ts             # TypeScript interfaces
        ├── hooks/
        │   └── useAuth.ts           # Authentication hook
        ├── components/              # Reusable UI components
        │   ├── Auth/
        │   │   └── LoginForm.tsx
        │   ├── Layout/
        │   │   └── Sidebar.tsx
        │   └── Dashboard/
        │       ├── Card.tsx
        │       ├── ProgressPanel.tsx
        │       └── NextDuePanel.tsx
        └── pages/
            ├── Login.tsx            # (not used — logic embedded in App + component)
            └── Dashboard.tsx        # Dashboard page
```

---

## Architecture Decisions

### 1. Backend: Django + DRF with package-by-domain

**Decision:** Split models, views, and serializers into Python packages rather
than monolithic files.

**Rationale:** As the domain grows (loans, payments, receipts, audit,
notifications, attachments), single-file modules become unmanageable. Each
model file is small, focused, and easy to test.

### 2. Settings: Single file with env overrides

**Decision:** Keep `settings.py` as a single well-formatted file, not split
into `base.py` / `local.py` / `production.py`.

**Rationale:** For an MVP, multi-file settings adds overhead without
proportional benefit. All secrets come from environment variables. When a
production deployment is needed, overriding via `DJANGO_SETTINGS_MODULE` or
a `docker-compose.prod.yml` is sufficient.

### 3. JWT authentication

**Decision:** Use `djangorestframework-simplejwt` with `JWTAuthentication` as
the default auth class and `IsAuthenticated` as the default permission class.

**Rationale:** Stateless auth suitable for SPA frontend. No server-side
sessions needed. The register endpoint is explicitly decorated with
`AllowAny`.

### 4. Receipts: No PDF storage

**Decision:** Receipts are rendered as HTML on demand via the
`GET /api/receipts/{id}/document/` endpoint. A SHA-256 hash is stored for
integrity verification.

**Rationale:** Eliminates PDF generation complexity, storage costs, and file
management. The HTML includes a print button and is printer-friendly via CSS
`@media print`.

### 5. Receipt finalization with dual signature

**Decision:** Both creditor and debtor must upload a signature image before
the receipt is finalized (document_hash generated).

**Rationale:** Provides mutual consent. The hash is computed from receipt
fields (number, amount, date, parties) and cannot be computed until both
parties have signed.

### 6. Audit trail

**Decision:** Every mutation (loan creation, payment, signature, cancel)
creates an `AuditLog` record with user, action, entity, IP, and user agent.

**Rationale:** Non-repudiation and transparency for financial operations.

### 7. Frontend: Component-based SPA

**Decision:** Split the UI into small components (Card, ProgressPanel,
Sidebar, LoginForm) composed in pages (Dashboard).

**Rationale:** Maintainability, testability, and future route-based navigation
(React Router).

### 8. Frontend: Dedicated API layer

**Decision:** All HTTP calls go through `api/client.ts` which injects the JWT
token and handles JSON serialization.

**Rationale:** Centralized error handling, token management, and base URL
configuration. Prevents scattered `fetch()` calls.

### 9. Docker Compose with health checks

**Decision:** PostgreSQL health check prevents the API from starting before
the database is ready.

**Rationale:** Eliminates race conditions on first startup without fragile
`sleep` commands.

---

## Data Model

```
User (AbstractUser)
├── id, username, email, password
├── name (nome ou apelido)
├── phone
└── photo

Loan
├── creditor ───────────┐
├── debtor ─────────────┤
├── amount, interest     │
├── installments,        │
│   installment_value    │
├── loan_date,           │
│   first_due_date       │
├── notes, status        │
└── created_at           │
                         │
Installment              │
├── loan ────────────────┘
├── number, due_date
├── amount, status
└── payment ───────────────────┐
                                │
Payment                         │
├── installment ────────────────┘
├── payment_date, amount
├── payment_method (pix/cash/...)
├── notes, proof
├── recorded_by
├── created_at
└── receipt ────────────────────┐
                                │
Receipt                         │
├── payment ────────────────────┘
├── number (UUID)
├── document_hash (SHA-256)
├── status
├── created_at
└── signatures ───────────┐
                           │
Signature                  │
├── receipt ───────────────┘
├── user
├── image
└── signed_at

AuditLog: user, action, entity, entity_id, ip, device, created_at
Notification: user, title, message, read_at, created_at
Attachment: loan, file, name, uploaded_at
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register/` | No | Create account |
| POST | `/api/auth/token/` | No | Obtain JWT |
| POST | `/api/auth/refresh/` | No | Refresh JWT |
| GET | `/api/dashboard/` | JWT | Dashboard overview |
| GET/POST | `/api/loans/` | JWT | List / Create loan |
| GET/PUT/PATCH/DELETE | `/api/loans/{id}/` | JWT | Loan detail |
| POST | `/api/loans/{id}/installments/{n}/pay/` | JWT | Pay installment |
| GET | `/api/payments/` | JWT | List payments |
| GET | `/api/receipts/` | JWT | List receipts |
| POST | `/api/receipts/{id}/sign/` | JWT | Sign receipt |
| GET | `/api/receipts/{id}/document/` | JWT | View receipt HTML |
| POST | `/api/receipts/{id}/cancel/` | JWT | Cancel receipt |

---

## How to Run

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/

To create a superuser:

```bash
docker compose exec api python manage.py createsuperuser
```
