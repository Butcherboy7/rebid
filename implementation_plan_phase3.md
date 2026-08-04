# Implementation Plan - Phase 3: Security & Enterprise Infrastructure

Focuses on enterprise environment security hardening, password reset workflows, and database migration framework integration.

---

## 🎯 Proposed Changes

### Component 1: Environment-Based Secret Key Security
#### [MODIFY] [auth.py](file:///e:/rebid%20neha/backend/app/auth.py)
#### [NEW] [.env](file:///e:/rebid%20neha/.env)
- **Changes**: Create `.env` containing `SECRET_KEY` and `DATABASE_URL`. Update `auth.py` to raise a runtime initialization error if `SECRET_KEY` is missing or set to a fallback string. Ensure `.env` remains ignored by git.

---

### Component 2: Password Reset & Recovery Workflow
#### [MODIFY] [main.py](file:///e:/rebid%20neha/backend/app/main.py)
#### [MODIFY] [BuyerLogin.jsx](file:///e:/rebid%20neha/frontend/src/pages/buyer/BuyerLogin.jsx)
#### [MODIFY] [VendorLogin.jsx](file:///e:/rebid%20neha/frontend/src/pages/vendor/VendorLogin.jsx)
- **Changes**: Add backend endpoint `POST /api/auth/reset-password`. Add "Forgot Password?" trigger on login forms rendering a modal window where users can reset demo passwords.

---

### Component 3: Alembic Database Migration Setup
#### [NEW] [alembic.ini](file:///e:/rebid%20neha/alembic.ini)
#### [NEW] [migrations/](file:///e:/rebid%20neha/backend/app/migrations)
- **Changes**: Initialize `alembic` migration environment. Generate initial baseline revision `001_initial_schema.py` targeting `Base.metadata`.

---

## 🧪 Verification Plan

### Automated Verification
- Test `.env` loading by verifying server starts cleanly with `.env` and fails if `SECRET_KEY` is omitted.
- Run `alembic upgrade head` to verify migration application.

### Manual Verification
- Test Password Reset: Click "Forgot Password?" on Buyer Login -> Enter email -> Confirm password updates successfully.
