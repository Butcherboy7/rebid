# ReBid AI - Project Handoff & Architecture Status

## 🚀 Architectural Overview
ReBid AI is an enterprise-grade autonomous reverse procurement platform built with FastAPI, SQLite, React (Vite), and XGBoost Machine Learning.

### 🌟 Key Innovations Completed
1. **XGBoost Classifier (`ml/xgb_model.json`, 84.12% accuracy)**: Evaluates multi-criteria vendor scorecards (Price 40%, SLA 30%, Delivery 20%, Reviews 10%).
2. **Indian Rupee (INR ₹) Currency Integration**: Formatted across all dashboards, profiles, tables, and PDFs using `formatINR()`.
3. **Admin Procurement Approval Queue**: Buyer creations default to `pending_approval` until 1-click approved by Admin.
4. **LinkedIn + Amazon Seller Hybrid Vendor Dossier (`VendorProfileModal.jsx`)**: Slide-over drawer with stat-consistent buyer reviews, 6-month contract trend charts, and AI match breakdowns.
5. **SAP / GeM Style Purchase Order PDF Engine**: Generates official contract award letters with GST (18%), payment terms, authorized digital signature stamps, and SHA256 verification hashes.
6. **Automated Collusion & Fraud Engine**: Rules 1, 2, and 3 (high-frequency bidding, <50% budget dump, and 60s collusive price match).
7. **Vendor Onboarding & Document Approval System**: Priority queue sorting (newest applicant top), document preview links & per-doc approval in `VendorProfileModal.jsx`, and synchronized `User.status` & `Vendor.verified` database status updates with automatic `AuthContext` status re-fetching.
8. **16-Point Production Platform Requirements**: Real Resend API 6-digit OTP email verification with cooldown/attempt limits, dev-mode console fallback when API key is unset, multi-step extended registration (Rep info, GST, PAN, CIN, Address, Bank details), zero alert/confirm dialogs (replaced with `ConfirmModal.jsx` and `ModalContext`), Admin queue sorting controls, 15% bot bidding tuning, and strict awarded contract filtering.
9. **Zero-Friction Local Setup & Environment Templates**: Created `.env.example`, converted `requirements.txt` to clean UTF-8 with full dependencies, and updated `README.md` with streamlined step-by-step PC execution guide and Resend API Key FAQ.

---

## 🏃 Local Run Commands
- **Backend Server**: `python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload`
- **Frontend Server**: `npm run dev` (inside `frontend/`)
- **Backend Test Suite**: `python scratch/test_backend.py`

---

## 🔑 Demo Accounts (Password: `password123`)
- **Buyer**: `buyer@rebid.ai`
- **Admin**: `admin@rebid.ai`
- **Vendors**: `vendor1@rebid.ai`, `vendor2@rebid.ai`, `lenovo@rebid.ai`, `acer@rebid.ai`, `tatasteel@rebid.ai`, `jswsteel@rebid.ai`, `ltconst@rebid.ai`, `bluedart@rebid.ai`, `dhl@rebid.ai`, `amazon@rebid.ai`
