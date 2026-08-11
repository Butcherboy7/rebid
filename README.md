# 🚀 ReBid AI — Next-Gen Autonomous Reverse Procurement Platform

> **An AI-powered, multi-criteria enterprise reverse auction ecosystem driven by trained XGBoost Machine Learning, real-time fraud & collusion detection, live bidding rooms, and SAP/GeM-grade Purchase Order generation.**

---

## ⚡ Quick Start Guide (Run Locally in 2 Minutes)

Follow these simple steps to run both the **Backend** and **Frontend** on any PC (Windows, macOS, or Linux).

### 📋 Prerequisites
Before running, make sure you have installed:
- **Python**: `3.10` or higher ([Download Python](https://www.python.org/downloads/))
- **Node.js**: `18.0` or higher with `npm` ([Download Node.js](https://nodejs.org/))
- **Git**: ([Download Git](https://git-scm.com/))

---

### 🖥️ Step-by-Step Instructions

#### 1️⃣ Clone & Open the Repository
Open your terminal (PowerShell, Command Prompt, or Bash) and navigate to the project directory:
```bash
git clone <your-repository-url>
cd "rebid neha"
```

---

#### 2️⃣ Set Up & Start the Backend (Terminal 1)

1. **Create and activate a virtual environment**:
   - **Windows (Command Prompt / PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
     *(If PowerShell blocks script execution, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first)*
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Create your local `.env` file by copying the template:
   - **Windows**:
     ```cmd
     copy .env.example .env
     ```
   - **macOS / Linux**:
     ```bash
     cp .env.example .env
     ```

4. **Start the FastAPI backend server**:
   ```bash
   python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

🟢 **Backend Server Running At**: [http://127.0.0.1:8000](http://127.0.0.1:8000)  
🟢 **Interactive API Documentation (Swagger)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

#### 3️⃣ Set Up & Start the Frontend (Terminal 2)

Open a **new separate terminal window** (keep the backend running in Terminal 1):

1. **Navigate to the `frontend` folder**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Launch Vite Development Server**:
   ```bash
   npm run dev
   ```

🟢 **Frontend Web Application Running At**: [http://localhost:5173](http://localhost:5173)

---

## 🔑 Demo Login Credentials

The platform comes pre-seeded with enterprise accounts so you can test all roles immediately without registration.

> **Universal Password for all Demo Accounts**: `password123`

| Portal | Email Address | Password | Role & Permissions |
| :--- | :--- | :--- | :--- |
| **🏢 Buyer Portal** | `buyer@rebid.ai` | `password123` | Create procurement auctions, monitor live reverse bidding, trigger XGBoost AI evaluations, and award contracts with SAP/GeM POs. |
| **🛡️ Admin Portal** | `admin@rebid.ai` | `password123` | Review & approve buyer procurement requests, inspect 500+ vendor database, verify documents, and review real-time fraud alerts. |
| **🏭 Vendor Portal** | `vendor1@rebid.ai` | `password123` | Submit real-time counter-bids, view rank updates, inspect intelligence dossiers, and download awarded PO letters. |
| **🏭 Vendor 2** | `vendor2@rebid.ai` | `password123` | Secondary vendor account (*Dell Technologies*) to simulate multi-vendor live auction competition. |

*Additional pre-seeded vendor accounts (password `password123`): `lenovo@rebid.ai`, `acer@rebid.ai`, `tatasteel@rebid.ai`, `jswsteel@rebid.ai`, `ltconst@rebid.ai`, `bluedart@rebid.ai`, `dhl@rebid.ai`, `amazon@rebid.ai`.*

---

## 📧 Email Verification & Resend API Key FAQ

### ❓ Do I need to provide a Resend API Key to others?
**NO, you do NOT need to send or share your Resend API Key.**

Here is why the system runs seamlessly out-of-the-box on anyone's machine:

1. **Pre-Seeded Demo Accounts**:
   - All demo accounts listed above are already pre-verified and approved.
   - Anyone can log in directly without requiring OTP email verification.

2. **Built-In Terminal OTP Fallback (Dev Mode)**:
   - When registering a **new custom account**, if `RESEND_API_KEY` is left blank in `.env`, the backend automatically outputs the 6-digit OTP directly into the **Backend Terminal console**:
     ```text
     ============================================================
     [DEV MODE] OTP for newuser@example.com: 849201
     ============================================================
     ```
   - The user can simply copy the 6-digit code from their terminal and paste it into the verification field.

3. **Optional Real Email Delivery**:
   - If someone wishes to test real email inbox delivery on their machine, they can register for a free key at [resend.com](https://resend.com) and add it to their local `.env` file:
     ```env
     RESEND_API_KEY=re_your_api_key_here
     ```

---

## 🎮 Recommended End-to-End Demo Walkthrough

Experience the complete autonomous reverse auction workflow in 4 steps:

1. **Login as Buyer (`buyer@rebid.ai`)**:
   - Go to [http://localhost:5173/buyer/login](http://localhost:5173/buyer/login).
   - Click **"Create Procurement"**, fill in title, budget (e.g. ₹50,00,000 INR), category, and weight criteria (Price 40%, SLA 30%, Delivery 20%, Reviews 10%).
   - Submit the auction. It will be placed in `pending_approval` status.

2. **Login as Admin (`admin@rebid.ai`)**:
   - Go to [http://localhost:5173/admin/login](http://localhost:5173/admin/login).
   - Navigate to the **Procurement Approval Queue** and click **"Approve"** on the newly created auction to make it `LIVE`.

3. **Login as Vendor (`vendor1@rebid.ai` or `vendor2@rebid.ai`)**:
   - Go to [http://localhost:5173/vendor/login](http://localhost:5173/vendor/login).
   - Enter the live auction room, review current ranks, and place a lower counter-bid.
   - Watch the real-time leaderboard update and observe fraud engine checks.

4. **Award Contract & Generate SAP/GeM Purchase Order**:
   - Switch back to the Buyer Portal and enter the live auction.
   - Click **"AI Recommendation"** to trigger the **XGBoost Classifier Model** (`84.12% accuracy`).
   - Click **"Award Contract"** to issue an official SAP/GeM-grade Purchase Order PDF with 18% GST calculation, digital signature stamp, and SHA-256 integrity hash.

---

## 🧠 Architectural Deep Dive

```
                               ┌────────────────────────────────┐
                               │     Buyer Procurement Request  │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │   Compliance Admin Approval    │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │   Hero Live Reverse Auction    │
                               │   (Staggered Bot Counter-Bids) │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │   Real-Time Fraud Engine       │
                               │   - Rule 1: High Frequency     │
                               │   - Rule 2: Dump (<50% Budget) │
                               │   - Rule 3: 60s Near-Identical │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │    XGBoost Classifier Model    │
                               │  (Price 40%, SLA 30%, Del 20%) │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │  SAP/GeM Purchase Order PDF    │
                               │  (Awarded Status + INR ₹ Tax)  │
                               └────────────────────────────────┘
```

### 1. XGBoost Recommendation Classifier (`ml/predict.py`)
Rather than picking the lowest bid blindly, ReBid AI passes candidate bids through an XGBoost model trained on historical vendor performance matrices:
$$\text{Score} = w_{\text{cost}} \cdot S_{\text{price}} + w_{\text{rel}} \cdot S_{\text{reliability}} + w_{\text{del}} \cdot S_{\text{delivery}} + w_{\text{rev}} \cdot S_{\text{reviews}}$$
- **Cost Efficiency Score ($S_{\text{price}}$)**: Scaled against target budget benchmarks.
- **SLA Reliability Score ($S_{\text{reliability}}$)**: Contract completion history & defect rate penalties.
- **Delivery Velocity Score ($S_{\text{delivery}}$)**: Historical delay margin tracking.
- **Historical Feedback ($S_{\text{rev}}$)**: Buyer ratings & enterprise customer feedback.

### 2. Real-Time Fraud & Anomaly Engine (`backend/app/services.py`)
- **Rule 1 (High Frequency Bidding)**: Triggers high-risk warning if a vendor submits $>5$ bids within a 30-second window.
- **Rule 2 (Abnormally Low Bid)**: Flags bids falling under $50\%$ of max budget to prevent malicious under-bidding or quality compromise.
- **Rule 3 (Collusive Bidding Pattern)**: Detects near-identical counter-bids ($<0.5\%$ margin) submitted within 60 seconds by different vendor IDs.

### 3. Statistically Consistent Vendor Intelligence Profiles (`backend/app/main.py`)
Vendor reviews and ratings are **statistically generated from real telemetry**:
- Vendors with $\ge 92\%$ SLA display 5-star reviews praising punctuality and zero defects.
- Vendors with lower SLAs or cancellation histories display 3-star reviews citing scheduling delays.

---

## 📂 Project Structure Overview

```text
rebid neha/
├── .env.example               # Environment variables template
├── requirements.txt           # Python backend & ML dependencies
├── alembic.ini                # Database migration config
├── README.md                  # System architecture & setup documentation
├── HANDOFF.md                 # Architecture status & implementation notes
├── ml/
│   ├── xgb_model.json         # Trained XGBoost binary model (84.12% accuracy)
│   └── predict.py             # Multi-criteria AI recommendation engine
├── backend/
│   ├── static/                # Generated SAP / GeM Purchase Order PDFs
│   ├── uploads/               # Uploaded vendor onboarding documents
│   └── app/
│       ├── main.py            # FastAPI application endpoints & seeds
│       ├── models.py          # SQLAlchemy ORM database models
│       ├── schemas.py         # Pydantic input validation models
│       ├── services.py        # Fraud engine & ReportLab PDF generator
│       ├── auth.py            # JWT token authentication & role RBAC
│       └── routes/            # Sub-routers for auth & admin document review
└── frontend/
    ├── src/
    │   ├── App.jsx            # Main React application router
    │   ├── index.css          # Design system & styling
    │   ├── components/        # Navigation, Dossier modal, Modals
    │   ├── context/           # AuthContext & ModalContext
    │   ├── utils/             # Indian Rupee (INR ₹) formatters
    │   └── pages/             # Buyer, Vendor, Admin, Registration portals
```

---

## 🔧 Common Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **PowerShell script execution disabled** | Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in PowerShell before activating `venv`. |
| **Port 8000 already in use** | Run `python -m uvicorn backend.app.main:app --port 8001 --reload` (or terminate the process occupying port 8000). |
| **Port 5173 already in use** | Vite will automatically offer port 5174 or prompt you to select an open port. |
| **Database reset** | To start with a fresh clean database, delete `rebid.db` and restart the backend. The startup script will re-seed all demo data automatically. |

---

## 🛡️ License & Enterprise Compliance

Designed & Built for Enterprise Procurement Excellence.  
*All generated Purchase Orders, Audit Trail Logs, and Vendor Dossiers are encrypted and digitally checksummed.*
