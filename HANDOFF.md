# ReBid AI - Project Handoff & Architecture Status

## 🚀 Architectural Overview
ReBid AI is an enterprise-grade autonomous reverse procurement platform built with FastAPI, SQLite, React (Vite), and XGBoost Machine Learning.

### 🌟 Key Innovations & Enhancements Completed
1. **Collapsible Sidebar Navigation System (`Navigation.jsx`, `index.css`)**: Added sidebar collapse toggle (`<ChevronLeft />` / `<ChevronRight />`), icon-only collapsed state (68px), tooltips, profile avatar compaction, and persistent `localStorage` preference (`rebid_sidebar_collapsed`).
2. **Registration Crash Fix & Verification Flow (`RegistrationWizard.jsx`)**: Resolved undefined `Mail` icon runtime crash that caused white screen when transitioning from Step 3 to Step 4. All 7 steps (Role -> Credentials -> Organization Profile -> OTP/Bank -> Docs -> Compliance Review -> Complete) now run seamlessly.
3. **High-Fidelity ReBid AI Brand Identity & Logo (`ReBidLogo.jsx`, `rebid-logo.svg`)**: Vector brand component featuring dual circular orbiting arrows in royal blue & electric purple enclosing a partnership handshake with ascending 3-column bar chart. Embedded across login, registration, mobile bar, dashboards, and favicon.
4. **Enriched Realistic Account Details (Database & Models)**: All 12 test accounts (Buyer, Admin, and 10 Industry Vendors) are seeded with realistic company names, representative names (e.g., Vikram Malhotra, Dr. Ananya Iyer, Rohan Sengupta), designations, 10-digit phone numbers, valid GSTINs, PANs, CINs, registered business addresses in Mumbai/Bengaluru/Gurugram, and direct-settlement banking details (IFSC, Account Number, UPI).
5. **Universal User & Vendor Profile Synchronization (`models.py`, `routes/user.py`)**: `User` model supports organization, representative, contact, tax, address, and bank fields. Profile endpoints dynamically handle viewing and updating for Buyers, Admins, and Vendors alike with automatic SQLite column migration.
6. **XGBoost Classifier (`ml/xgb_model.json`, 84.12% accuracy)**: Evaluates multi-criteria vendor scorecards (Price 40%, SLA 30%, Delivery 20%, Reviews 10%).
7. **Indian Rupee (INR ₹) Currency Integration**: Formatted across all dashboards, profiles, tables, and PDFs using `formatINR()`.
8. **Interactive Role-Aware Login (`UnifiedLogin.jsx`)**: Role selector tabs (`[ 🛍️ Buyer | 🚚 Vendor | 🛡️ Admin ]`), query parameter support (`?role=BUYER`), role-specific quick demo login buttons, and loop-free history routing.
9. **Enterprise Profile Management (`ProfileView.jsx`)**: Full profile viewing and updating capability for all roles with `PROFILE_UPDATED` audit logging.
10. **System Settings & Security Management (`SettingsView.jsx`)**: In-app password change, audio & alert toggles, compact table mode, and cryptographic SHA256 session governance.
11. **Multi-Step Registration Validation & WebOTP (`RegistrationWizard.jsx`)**: Strict client-side validation per step, WebOTP API support, and 6-digit smart paste autofill with auto-verify.
12. **Transparent Account Approval Lifecycle**: Clear user messaging on registration and login states (`pending_verification` -> `pending_documents` -> `pending_approval` / `under_review` -> `approved`), preventing unauthorized access before administrator document approval.
13. **SAP / GeM Style Purchase Order PDF Engine**: Generates official contract award letters with GST (18%), payment terms, authorized digital signature stamps, and SHA256 verification hashes.
14. **Automated Collusion & Fraud Engine**: Rules 1, 2, and 3 (high-frequency bidding, <50% budget dump, and 60s collusive price match).
15. **Email OTP Verification**: Real 6-digit OTP verification via Resend API with cooldown limits and dev-mode console fallback.
16. **Master Documentation & Viva Defense Encyclopedia (`README.md`)**: Comprehensive, encyclopedic reference covering all 862 questions including domain theory, reverse auction dynamics, tech stack justifications (CSS/Tailwind, AES, H.264/H.265, FastAPI, React 19, Vite, SQLite), 7 core ML features and XGBoost formulations, 3 fraud/collusion rules, SHA-256 chained audit ledger, full forms dictionary, and verbatim answers for Q823-Q862.

---

## 🏃 Local Run Commands
- **Backend Server**: `python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001 --reload`
- **Frontend Server**: `npm run dev` (inside `frontend/`)
- **Backend Test Suite**: `python scratch/test_enhancements.py` & `python scratch/test_master_verification.py`
- **Frontend Production Build**: `npm run build` (inside `frontend/`)

---

## 🔑 Demo Accounts (Password: `password123`)
- **Buyer**: `buyer@rebid.ai` (Apex Global Procurement Ltd - Vikram Malhotra, VP Sourcing)
- **Admin**: `admin@rebid.ai` (ReBid AI Governance - Dr. Ananya Iyer, Chief Compliance Officer)
- **Vendors**:
  - `vendor1@rebid.ai`: Hewlett Packard Enterprise India Pvt Ltd (Rohan Sengupta, Director)
  - `vendor2@rebid.ai`: Dell International Services India Pvt Ltd (Meera Krishnan, Sales Head)
  - `lenovo@rebid.ai`: Lenovo India Private Limited (Amitabh Verma, Executive Director)
  - `acer@rebid.ai`: Acer India Private Limited (Siddharth Nair, Head Govt & Commercial)
  - `tatasteel@rebid.ai`: Tata Steel Limited (Debashish Roy, Chief Procurement)
  - `jswsteel@rebid.ai`: JSW Steel Infra Ltd (Pooja Hegde, VP Industrial Marketing)
  - `ltconst@rebid.ai`: Larsen & Toubro Limited (K. R. Venkataraman, Senior VP Contracts)
  - `bluedart@rebid.ai`: Blue Dart Express Limited (Sunil Shenoy, Head of Logistics)
  - `dhl@rebid.ai`: DHL Express India Pvt Ltd (Farhan Qureshi, Director Global Forwarding)
  - `amazon@rebid.ai`: Amazon Wholesale India Private Limited (Priyanka Saxena, General Manager B2B)
