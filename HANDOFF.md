# ReBid AI - Project Handoff & Architecture Status

## 🚀 Architectural Overview
ReBid AI is an enterprise-grade autonomous reverse procurement platform built with FastAPI, SQLite, React (Vite), and XGBoost Machine Learning.

### 🌟 Key Innovations & Enhancements Completed
1. **XGBoost Classifier (`ml/xgb_model.json`, 84.12% accuracy)**: Evaluates multi-criteria vendor scorecards (Price 40%, SLA 30%, Delivery 20%, Reviews 10%).
2. **Indian Rupee (INR ₹) Currency Integration**: Formatted across all dashboards, profiles, tables, and PDFs using `formatINR()`.
3. **Unified Single-Sidebar Navigation System (`Navigation.jsx`)**: Consolidated all views across Buyer, Vendor, and Admin exclusively into the sidebar; removed redundant top horizontal tabs (`.filter-tabs`) and obsolete `Navbar.jsx`.
4. **ReBid AI Brand Identity & Logo System (`ReBidLogo.jsx`)**: Scalable SVG brand component featuring stylized reverse-auction quantum glyph, gradient typography, and light/dark theme variants embedded across the platform.
5. **Interactive Role-Aware Login (`UnifiedLogin.jsx`)**: Added role selector tabs (`[ 🛍️ Buyer | 🚚 Vendor | 🛡️ Admin ]`), query parameter support (`?role=BUYER`), role-specific quick demo login buttons, and loop-free history routing.
6. **Enterprise Profile Management (`ProfileView.jsx`)**: Full profile viewing and updating capability for all roles (personal, contact, legal entity, GSTIN, PAN, CIN, and direct-settlement banking details) backed by `GET /api/user/profile` and `PUT /api/user/profile` with `PROFILE_UPDATED` audit logging.
7. **System Settings & Security Management (`SettingsView.jsx`)**: In-app password change (verifying current password hash and enforcing minimum 6-character length), audio & alert toggles, compact table mode, and cryptographic SHA256 session governance backed by `POST /api/user/change-password` and `GET/PUT /api/user/preferences`.
8. **Multi-Step Registration Validation & WebOTP (`RegistrationWizard.jsx`)**: Strict client-side validation per step (email regex, password matching, 10-digit phone, 15-character GSTIN, 10-character PAN, mandatory documents); integrated WebOTP API (`navigator.credentials.get`), `autoComplete="one-time-code"`, and 6-digit smart paste autofill with auto-verify.
9. **Transparent Account Approval Lifecycle**: Clear user messaging on registration and login states (`pending_verification` -> `pending_documents` -> `pending_approval` / `under_review` -> `approved`), preventing unauthorized access before administrator document approval.
10. **Dynamic Database Vendor Counts**: Replaced static "500+ Vendor Directory" badges in Admin with live database counts from `/api/admin/vendors`.
11. **Vendor UI Layout Alignment & Polish (`VendorDashboard.jsx`)**: Fixed padding, standardized card hierarchies, enhanced live bidding room telemetry header, polished leaderboard rank medals (🥇, 🥈, 🥉), and responsive action controls.
12. **SAP / GeM Style Purchase Order PDF Engine**: Generates official contract award letters with GST (18%), payment terms, authorized digital signature stamps, and SHA256 verification hashes.
13. **Automated Collusion & Fraud Engine**: Rules 1, 2, and 3 (high-frequency bidding, <50% budget dump, and 60s collusive price match).
14. **Vendor Onboarding & Document Approval System**: Priority queue sorting (newest applicant top), document preview links & per-doc approval in `VendorProfileModal.jsx`, and synchronized `User.status` & `Vendor.verified` database status updates.
15. **Email OTP Verification**: Real 6-digit OTP verification via Resend API with cooldown limits and dev-mode console fallback.

---

## 🏃 Local Run Commands
- **Backend Server**: `python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001 --reload`
- **Frontend Server**: `npm run dev` (inside `frontend/`)
- **Backend Test Suite**: `python scratch/test_enhancements.py` & `python scratch/test_master_verification.py`
- **Frontend Production Build**: `npm run build` (inside `frontend/`)

---

## 🔑 Demo Accounts (Password: `password123`)
- **Buyer**: `buyer@rebid.ai`
- **Admin**: `admin@rebid.ai`
- **Vendors**: `vendor1@rebid.ai`, `vendor2@rebid.ai`, `lenovo@rebid.ai`, `acer@rebid.ai`, `tatasteel@rebid.ai`, `jswsteel@rebid.ai`, `ltconst@rebid.ai`, `bluedart@rebid.ai`, `dhl@rebid.ai`, `amazon@rebid.ai`
