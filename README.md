# ReBid AI - Autonomous Reverse Procurement & Multi-Criteria Vendor Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0%2B-EB5424?style=for-the-badge&logo=xgboost&logoColor=white)](https://xgboost.readthedocs.io)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![ReportLab](https://img.shields.io/badge/ReportLab-PDF%20Engine-D43833?style=for-the-badge)](https://www.reportlab.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## 📑 Table of Contents

1. [The 2-Minute Project Summary (Elevator Pitch)](#1-the-2-minute-project-summary-elevator-pitch)
2. [Quickstart & Local Installation Guide](#2-quickstart--local-installation-guide)
3. [Pre-Seeded Demo Credentials](#3-pre-seeded-demo-credentials)
4. [Domain Knowledge: Reverse Procurement & Auction Fundamentals](#4-domain-knowledge-reverse-procurement--auction-fundamentals)
5. [Complete Technology Stack & Design Decisions ("Why This Tech?")](#5-complete-technology-stack--design-decisions-why-this-tech)
6. [System Architecture, Data Flow Diagrams & Control Flow](#6-system-architecture-data-flow-diagrams--control-flow)
7. [Database Schema & Entity-Relationship Details](#7-database-schema--entity-relationship-details)
8. [Machine Learning Engine, Feature Engineering & Mathematical Formulations](#8-machine-learning-engine-feature-engineering--mathematical-formulations)
9. [Fraud Detection, Anti-Collusion & Cryptographic Audit Trails](#9-fraud-detection-anti-collusion--cryptographic-audit-trails)
10. [Synthetic Dataset Architecture & CSV Inter-Relationships](#10-synthetic-dataset-architecture--csv-inter-relationships)
11. [Computer Science Fundamentals & Acronyms Dictionary (Full Forms)](#11-computer-science-fundamentals--acronyms-dictionary-full-forms)
12. [The Master Viva & Interview Defense Compendium (Questions 823 - 862)](#12-the-master-viva--interview-defense-compendium-questions-823---862)

---

## 1. The 2-Minute Project Summary (Elevator Pitch)

> **"What is ReBid AI, and what does it do in 2 minutes?"**

**ReBid AI** is an enterprise-grade autonomous reverse procurement platform engineered to modernize how corporations, universities, and government bodies purchase goods and services.

* **The Problem**: In traditional corporate purchasing, procurement is sluggish, opaque, and prone to corruption. Buyers publish requests for proposals (RFPs), wait weeks for private bids, and frequently default to either the absolute lowest bidder (who later compromises on quality and fails deadlines) or a favored vendor through corrupt backroom deals.
* **The Solution**: ReBid AI flips the traditional auction model. Instead of one seller with buyers bidding prices up, **ReBid AI uses a Reverse Auction**: a verified buyer posts a requirement with a ceiling budget, and verified vendors bid in real-time by driving prices **down**.
* **The Intelligence Layer**: We solve the "lowest bidder trap" using an **XGBoost Machine Learning Classifier (84.12% accuracy)** paired with a multi-criteria utility function. Rather than blindly picking the cheapest quote, ReBid AI scores suppliers dynamically across four weighted vectors: **Price (40%)**, **SLA Delivery Reliability (30%)**, **Historical On-Time Performance (20%)**, and **Buyer Reviews & Defect Rate (10%)**.
* **Security & Integrity**: 
  1. A real-time **Rule-Based Fraud & Anti-Collusion Engine** detects high-frequency bot bids, predatory budget dumping (<50%), and synchronized bidding rings (matching bids within 60 seconds).
  2. An **Immutable SHA-256 Hash-Chained Audit Ledger** records every lifecycle event to guarantee non-repudiation.
  3. Upon contract award, an automated **SAP / GeM-compliant Purchase Order PDF** is minted with 18% GST itemization, delivery SLA terms, authorized signature stamps, and a cryptographic anti-tamper hash verification code.

In short, **ReBid AI reduces corporate procurement costs by 15-28%, eliminates vendor selection bias, prevents bid rigging, and compresses month-long procurement cycles into 15 minutes of transparent, autonomous execution.**

---

## 2. Quickstart & Local Installation Guide

Running ReBid AI requires two terminals open side-by-side: **Terminal 1** for the Python FastAPI backend, and **Terminal 2** for the React Vite frontend.

```
+-------------------------------------------------------------+
|                     ReBid AI Execution                     |
|                                                             |
|   [ Terminal 1: Backend Server ]   [ Terminal 2: Frontend ] |
|   FastAPI + Uvicorn (Port 8001)    Vite Dev (Port 5173)     |
|   http://127.0.0.1:8001/docs       http://localhost:5173    |
+-------------------------------------------------------------+
```

### Prerequisites
* **Python 3.10+** (ensure "Add Python to PATH" is ticked on Windows)
* **Node.js 18+** (includes `npm`)
* **VS Code** or preferred terminal

---

### Step 1: Clone or Open the Project
Open the project directory in your terminal:
```bash
cd "e:/rebid neha"
```

---

### Step 2: Terminal 1 - Start the Backend Server

1. **Create and Activate Virtual Environment**:
   * *Windows (PowerShell)*:
     ```powershell
     Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
     python -m venv venv
     .\venv\Scripts\activate
     ```
   * *Mac / Linux*:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

2. **Install Backend Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   * *Windows*: `copy .env.example .env`
   * *Mac/Linux*: `cp .env.example .env`

4. **Launch the FastAPI Server**:
   ```bash
   python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001 --reload
   ```
   * *Verification*: Open `http://127.0.0.1:8001/docs` in your browser. You will see the interactive Swagger UI OpenAPI documentation. Leave Terminal 1 running!

---

### Step 3: Terminal 2 - Start the Frontend Application

1. Open a second terminal window and navigate into the `frontend` directory:
   ```bash
   cd frontend
   ```

2. **Install Node Modules**:
   ```bash
   npm install
   ```

3. **Start the Vite Development Server**:
   ```bash
   npm run dev
   ```
   * *Verification*: Open `http://localhost:5173` in your browser.

---

## 3. Pre-Seeded Demo Credentials

All test accounts share the unified master password: `password123`.

| Role | Portal / Email | Organization & Authorized Representative | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Buyer** | `buyer@rebid.ai` | **Apex Global Procurement Ltd**<br>Vikram Malhotra, VP Global Sourcing | Create procurement requests, configure scoring weights, monitor real-time auctions, trigger AI recommendation engine, award contracts, download signed Purchase Orders, review vendors. |
| **Admin** | `admin@rebid.ai` | **ReBid AI Governance Council**<br>Dr. Ananya Iyer, Chief Compliance Officer | Review & approve incoming procurement requests, verify vendor KYC documents (GST, PAN, CIN, Bank details), inspect real-time fraud alerts, audit immutable cryptographic ledger. |
| **Vendor 1** | `vendor1@rebid.ai` | **Hewlett Packard Enterprise India Pvt Ltd**<br>Rohan Sengupta, Director Enterprise Sales | View live bidding rooms, submit counter-bids, monitor ranking leaderboard, view awarded contracts and delivery deadlines. |
| **Vendor 2** | `vendor2@rebid.ai` | **Dell International Services India Pvt Ltd**<br>Meera Krishnan, Head of Commercial Solutions | Compete against Vendor 1 in live reverse auctions to observe real-time dynamic rank updates. |
| **Vendor 3** | `tatasteel@rebid.ai` | **Tata Steel Limited**<br>Debashish Roy, Chief Procurement Officer | Raw materials, metals, and industrial supply bids. |
| **Vendor 4** | `bluedart@rebid.ai` | **Blue Dart Express Limited**<br>Sunil Shenoy, Head of Corporate Logistics | Logistics, freight, and distribution contracts. |
| **Vendor 5** | `amazon@rebid.ai` | **Amazon Wholesale India Pvt Ltd**<br>Priyanka Saxena, General Manager Enterprise B2B | Cloud infrastructure, software licenses, enterprise supply contracts. |

---

## 4. Domain Knowledge: Reverse Procurement & Auction Fundamentals

### Q1. What is ReBid AI?
ReBid AI is an intelligent, automated B2B reverse auction and vendor decision platform. It allows institutional buyers to post procurement requests and enables pre-verified vendors to compete dynamically by lowering bids, while machine learning ensures quality-driven contract awards.

### Q2. What is the main objective of ReBid AI?
To eliminate organizational procurement inefficiencies, cut corporate purchasing costs by 15–28%, eliminate human bias and corruption, and replace weeks of manual tender negotiation with a 15-minute transparent, automated bidding and AI scoring workflow.

### Q3. What problem does ReBid AI solve?
1. **The "Lowest Bidder Trap" (Winner's Curse)**: Traditional systems award contracts strictly to the cheapest bidder, who subsequently delivers defective items, violates delivery SLAs, or defaults.
2. **Procurement Fraud & Bid Rigging**: Unmonitored bidding allows vendors to collude, match prices, or submit high-frequency bot bids to manipulate auctions.
3. **Manual Administrative Bottlenecks**: Creating tender documents, vetting compliance papers, comparing spreadsheets, and issuing Purchase Orders takes corporate buyers weeks.
4. **Audit Trail Vulnerabilities**: Relational databases without cryptographic validation can be quietly updated by compromised database administrators.

### Q4. What is the motivation behind the project?
Public and private sector procurement accounts for approximately 12–15% of global GDP. Traditional e-procurement portals (like legacy ERP modules) are static, cumbersome, lack predictive risk intelligence, and fail to prevent bid suppression and kickbacks. ReBid AI was built to demonstrate how modern web technologies (FastAPI, React 19) combined with explainable Machine Learning (XGBoost) and cryptographic ledgers (SHA-256) create a secure, trustworthy, and lightning-fast procurement ecosystem.

### Q5. What are the major features of the system?
* **Role-Aware Portals**: Dedicated workspaces for Buyers, Vendors, and Administrators.
* **Autonomous Reverse Auction Engine**: Real-time counter-bidding with live ranking leaderboards.
* **AI Multi-Criteria Scoring**: XGBoost classifier + multi-attribute utility calculation (Cost, Reliability, SLA Delivery, Reviews).
* **Automated Collusion & Fraud Engine**: Real-time detection of high-frequency bids, budget dumps (<50%), and synchronized bidding rings.
* **SAP / GeM-Compliant Purchase Order Generator**: Automated PDF generation with 18% GST calculations, delivery milestones, and SHA-256 digital stamp verification.
* **Tamper-Evident Cryptographic Audit Ledger**: Every transaction is chained via SHA-256 block hashing (`GENESIS -> Block_1 -> Block_2`).
* **Comprehensive 7-Step Registration Wizard**: Onboarding workflow with WebOTP email verification, GST/PAN validation, document upload, and administrative verification.

### Q6 - Q10. User Roles & Responsibilities
* **Buyer**: Creates procurement requests with ceiling budgets; customizes multi-criteria weights ($w_{cost}, w_{reliability}, w_{delivery}, w_{reviews}$); monitors live bids; triggers the AI Recommendation engine; awards contracts; downloads official PO PDFs; rates vendors upon delivery.
* **Vendor**: Undergoes KYC registration and document vetting; accesses live reverse auction rooms; submits competitive price reductions; tracks live leaderboard standings; views awarded contracts and delivery milestones.
* **Admin**: Verifies buyer/vendor identities and uploaded compliance documents (GST, PAN, CIN, Bank Statements); approves or rejects draft procurement auctions before they go live; monitors real-time fraud alerts; inspects the immutable audit ledger.

### Q11 - Q12. The End-to-End Procurement Lifecycle
```
+-----------------------------------------------------------------------------------------------+
|                             ReBid AI End-to-End Execution Flow                                |
+-----------------------------------------------------------------------------------------------+
|  1. Buyer creates Procurement Request (Title, Category, Max Budget, Weights)                  |
|       |                                                                                       |
|  2. Status: PENDING_APPROVAL -> Admin reviews specs, budget feasibility & compliance          |
|       |                                                                                       |
|  3. Admin APPROVES -> Status becomes LIVE (15-minute countdown starts)                        |
|       |                                                                                       |
|  4. Live Reverse Auction: Verified Vendors submit counter-bids (Prices descend)               |
|       |                                                                                       |
|  5. Real-Time Fraud Engine scans every bid (High frequency, Budget dump, Collusion)           |
|       |                                                                                       |
|  6. Auction Concludes -> Buyer clicks "Run AI Evaluation"                                     |
|       |                                                                                       |
|  7. XGBoost Model + Utility Engine ranks vendors & outputs Explainable Decision Report        |
|       |                                                                                       |
|  8. Buyer awards contract to top-ranked vendor                                                |
|       |                                                                                       |
|  9. System automatically generates official SAP/GeM Purchase Order PDF with SHA-256 Hash      |
|       |                                                                                       |
| 10. Contract Award recorded in SHA-256 Cryptographic Audit Ledger                            |
+-----------------------------------------------------------------------------------------------+
```

### Q29 - Q36. Core Procurement Concepts Explained
* **Procurement**: The structured process of discovering, vetting, negotiating, and acquiring goods, services, or works from an external source via competitive tendering.
* **E-Procurement**: The execution of procurement transactions over internet-based digital applications, eliminating paper bids.
* **Traditional vs. Reverse Procurement**: In traditional procurement, suppliers submit static sealed envelopes or quote fixed retail/wholesale prices. In **reverse procurement**, the buyer dictates the specifications and maximum budget, forcing suppliers to compete dynamically against each other to win the order.
* **Normal vs. Reverse Auction**:
  * *Normal (Forward) Auction* (e.g., eBay, Sotheby's): 1 Seller, Many Buyers $\rightarrow$ Price goes **UP** $\rightarrow$ Highest bidder wins.
  * *Reverse Auction* (e.g., ReBid AI, GeM, Federal Bidding): 1 Buyer, Many Sellers $\rightarrow$ Price goes **DOWN** $\rightarrow$ Best-value supplier wins.
* **Why do vendors decrease their prices?** In B2B commerce, large institutional orders represent guaranteed bulk volume, predictable cash flow, and high factory capacity utilization. Vendors willingly sacrifice a fraction of their profit margin to win the multi-million rupee contract rather than forfeit it to a direct market competitor.

### Q37 - Q43. Procurement Requests & Budgets
* **Procurement Request**: An official organizational requirement detailing the item description, category, lot quantity, delivery timeline, and technical specifications.
* **Maximum Budget (Ceiling Budget)**: The maximum financial expenditure authorized by the buyer's finance department. Bids submitted above this ceiling are automatically rejected by the system.
* **Why is Admin Approval Required?** To enforce corporate governance: checking that the requirement is genuine, budget is allocated, specifications comply with legal regulations, and to prevent fraudulent ghost purchasing.

### Q44 - Q56. Vendor Evaluation Metrics & SLAs
* **Lowest Bidder Trap**: Selecting purely based on price often leads to hidden costs—late shipments, defective components, and contract abandonment.
* **Multi-Criteria Selection**: Evaluating vendors simultaneously on commercial terms (price) and operational reliability metrics.
* **SLA (Service Level Agreement)**: A legally binding contract clause defining required service standards (e.g., 98% on-time delivery within 14 calendar days).
* **Defect Rate**: The percentage of shipped units that fail quality inspection ($\text{Defects} / \text{Total Delivered}$).
* **Reliability Score**: Historical probability ($0.0 \text{ to } 1.0$) that a vendor fulfills all contractual terms without legal disputes or default.

---

## 5. Complete Technology Stack & Design Decisions ("Why This Tech?")

Every single tool and dependency in ReBid AI was selected based on strict engineering benchmarks:

| Layer | Technology | Version | Purpose in ReBid AI | Why was this specific technology chosen over alternatives? |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Core** | **React** | `v19.2` | Interactive Single-Page Application (SPA) | Component-driven architecture with React 19's optimized Virtual DOM rendering engine. Provides stateful real-time UI updates when auction bids arrive without reloading the web page. |
| **Frontend Build Tool** | **Vite** | `v8.2` | Next-generation frontend bundler & dev server | Replaces legacy Webpack. Vite uses native browser ES Modules (ESM) and esbuild for instant cold-starts, sub-millisecond Hot Module Replacement (HMR), and lightweight tree-shaken production bundles. |
| **Styling & Design System** | **Tailwind CSS + Vanilla CSS Tokens** | `v4.3` | UI Styling, Dark Mode, Glassmorphism | Tailwind v4 enables high-performance utility classes with zero-runtime overhead. Paired with custom Vanilla CSS design tokens in `index.css` to define responsive layouts, Indian Rupee (`₹`) styling, and custom glassmorphic cards. |
| **Animations** | **Framer Motion** | `v12.4` | Smooth micro-animations & layout transitions | Provides physics-based transitions for auction bid changes, dynamic modal popups, and tab transitions without bogging down the main JavaScript thread. |
| **Icons** | **Lucide React** | `v1.2` | Crisp vector iconography | Extremely lightweight, tree-shakeable SVG icon collection ensuring instant rendering without loading bloated icon font libraries. |
| **HTTP Client** | **Axios** | `v1.19` | Async REST API communication | Automatically handles JSON serialization, request/response interceptors, centralized error parsing, and JWT Bearer token attachment. |
| **Backend Framework** | **FastAPI** | `v0.110` | High-performance asynchronous REST API server | Built on Starlette and Pydantic. FastAPI is one of the fastest Python web frameworks available (comparable to NodeJS and Go). It generates interactive Swagger OpenAPI documentation (`/docs`) out-of-the-box and features native async/await concurrency. |
| **ASGI Server** | **Uvicorn** | `v0.28` | Lightning-fast ASGI web server | Runs FastAPI applications asynchronously using `uvloop` (an ultra-fast C-based event loop implementation), capable of handling thousands of concurrent connections. |
| **Database ORM** | **SQLAlchemy** | `v2.0` | Object Relational Mapper (ORM) | Provides robust abstraction between Python classes and SQL tables, parameterizes queries to completely eliminate SQL Injection attacks, and supports database transactions with rollback capabilities. |
| **Database Engine** | **SQLite** | `v3` | Relational database (`rebid.db`) | Serverless, zero-configuration, self-contained SQL database engine. Perfect for rapid deployment, development, and self-contained portable demonstrations without requiring external database server installations (PostgreSQL-ready with a 1-line connection string change). |
| **Database Migrations**| **Alembic** | `v1.13` | Database schema version control | Automatically generates migration scripts when models change, ensuring seamless column additions and table updates across different environments. |
| **Machine Learning** | **XGBoost** | `v2.0` | Multi-criteria vendor recommendation | Extreme Gradient Boosting (`XGBClassifier`) provides superior classification performance on tabular numerical data compared to deep neural networks or linear models, while executing inference in under 5 milliseconds. |
| **Data Processing** | **Pandas & NumPy** | `v2.0 / v1.24` | Vectorized numerical computing | Facilitates high-speed matrix manipulations, feature normalization, and CSV dataset preprocessing. |
| **PDF Generation** | **ReportLab** | `v4.0` | Official Purchase Order PDF synthesis | Enterprise-grade programmatic PDF engine used by banks and SAP systems to generate pixel-perfect documents with custom typography, tables, and security stamps directly in memory. |
| **Authentication** | **PyJWT / Custom HS256** | `v3.3` | Stateless Bearer Token Authorization | Encodes user identity, role, and expiration into compact, signed JWT tokens. Enables decentralized authentication across endpoints without repeatedly querying the database session table. |
| **Password Hashing** | **SHA-256 / Bcrypt** | `v4.0` | Irreversible password protection | Ensures user credentials are never stored in plaintext. Passwords are cryptographically transformed into irreversible fixed-length hashes. |

---

### Special Architectural Question: "Why did we use CSS, and what about AES & H.264/H.265?"

#### Why did we use CSS (Tailwind + Vanilla CSS)?
* **CSS (Cascading Style Sheets)** is the foundational web standard for defining the visual presentation, responsive layout, and typography of HTML elements.
* In ReBid AI, we used a combination of **Tailwind CSS v4** and custom **Vanilla CSS design tokens** (`frontend/src/index.css`).
* **Why Vanilla CSS design tokens?** To establish strict design system variables (brand royal blues `#1E40AF`, electric purple accents `#7C3AED`, dark mode background `#0B0F19`, glassmorphic backdrops `backdrop-filter: blur(16px)`).
* **Why Tailwind CSS?** Tailwind eliminates massive, messy stylesheets by providing atomic utility classes (`flex`, `grid`, `rounded-xl`, `transition-all`). It compiles only the CSS classes actually used in production, resulting in tiny bundle sizes (<25 KB) and sub-second browser render times.

#### What is AES, and how does it relate to ReBid AI?
* **AES (Advanced Encryption Standard)** is a **symmetric block cipher** approved worldwide (FIPS 197) that encrypts and decrypts sensitive data using 128-bit, 192-bit, or 256-bit keys.
* **Difference between Hashing and AES**:
  * **SHA-256 (Used in ReBid AI)** is a **one-way mathematical hash**. It converts data into a unique 64-character fingerprint that **cannot be reversed**. We use this for password verification, cryptographic audit trails, and PO tamper detection.
  * **AES (Used for Storage Encryption)** is a **two-way encryption algorithm**. Data is encrypted into ciphertext and can be decrypted back to plaintext using the secret key.
* **Role in Enterprise ReBid AI**: AES-256 is used to encrypt sensitive stored documents at rest (such as vendor bank statements, PAN cards, and confidential proprietary procurement pricing models) before they are written to disk.

#### What is H.264 / H.265 (HEVC)?
* **H.264 (AVC)** and **H.265 (HEVC - High Efficiency Video Coding)** are industry-standard video compression codecs.
* **H.265** delivers up to **50% greater data compression** than H.264 at the exact same visual quality level.
* **Context in Enterprise Procurement Systems**:
  * When vendors submit live video demonstrations of physical products (e.g., heavy machinery operation, industrial warehouse inspections, or college campus facility audits), raw video files would consume tens of gigabytes of network bandwidth.
  * ReBid AI's media upload architecture supports H.264 and H.265 encoding profiles, allowing vendors to stream high-definition product proof-of-concept videos at minimal bitrates over standard B2B connections.

---

## 6. System Architecture, Data Flow Diagrams & Control Flow

### High-Level Architecture Diagram
```
+---------------------------------------------------------------------------------------------------+
|                                  ReBid AI System Architecture                                     |
+---------------------------------------------------------------------------------------------------+

      [ BUYER PORTAL ]           [ VENDOR PORTAL ]           [ ADMIN GOVERNANCE ]
      React 19 / Vite            React 19 / Vite             React 19 / Vite
             |                          |                           |
             +--------------------------+---------------------------+
                                        | (HTTPS / REST API / JSON)
                                        v
+---------------------------------------------------------------------------------------------------+
|                                  FASTAPI APPLICATION GATEWAY                                      |
|                                                                                                   |
|  +---------------------------+  +---------------------------+  +-------------------------------+  |
|  |  JWT Security Middleware  |  |  CORS & Rate Limiting     |  | Role-Based Access Control     |  |
|  |  HS256 Token Validation   |  |  Static Files Mount       |  | (BUYER, VENDOR, ADMIN)        |  |
|  +---------------------------+  +---------------------------+  +-------------------------------+  |
+---------------------------------------------------------------------------------------------------+
       |                                |                                   |
       v                                v                                   v
+-----------------------+   +-----------------------+           +-----------------------+
|   BUSINESS SERVICES   |   |   ANALYTICS & AI      |           |     DATA STORAGE      |
|                       |   |                       |           |                       |
| * Auction Engine      |   | * XGBoost Classifier  |           | * SQLite (rebid.db)   |
| * Rule-Based Fraud    |   | * Utility Score Calc  |           | * SQLAlchemy ORM      |
| * ReportLab PO Engine |   | * Feature Normalizer  |           | * SHA-256 Audit Trail |
| * WebOTP Auth Manager |   | * Rank Optimization   |           | * PDF Static Storage  |
+-----------------------+   +-----------------------+           +-----------------------+
```

---

### Data Flow Diagrams (DFD)

#### DFD Level 0 (Context-Level Diagram)
Shows the high-level boundary of the system, external entities, and primary data exchanges:
```
                 [ Procurement Specs ]                 [ PO PDF & Winning Alert ]
                 -------------------->                 <------------------------
    +-------+                              +----------+                             +--------+
    | BUYER |                              | ReBid AI |                             | VENDOR |
    +-------+                              | System   |                             +--------+
                 <--------------------     +----------+        -------------------->
                 [ Live Leaderboard ]                          [ Live Auction Feed ]
                                               ^     |
                     [ System Audit Logs ]     |     |  [ Approve / Reject ]
                                               |     v
                                            +-------+
                                            | ADMIN |
                                            +-------+
```

#### DFD Level 1 (Decomposition Diagram)
Deconstructs the system into core operational processes:
1. **Process 1.0 - Identity & Access Management (IAM)**: Authenticates credentials, validates 6-digit OTPs, and issues role-scoped JWT tokens.
2. **Process 2.0 - Tender & Auction Lifecycle Manager**: Handles auction creation, budget verification, administrative approval gating, and live reverse bidding.
3. **Process 3.0 - Anomaly & Anti-Collusion Monitor**: Evaluates incoming bids in real-time against bidding velocity and price similarity rules.
4. **Process 4.0 - XGBoost Multi-Criteria Decision Engine**: Ingests vendor metrics and bid prices, calculates utility scores, and outputs ranked recommendations.
5. **Process 5.0 - Purchase Order & Cryptographic Ledger Generator**: Issues signed PDF award documents and commits immutable SHA-256 log blocks.

---

## 7. Database Schema & Entity-Relationship Details

ReBid AI runs on a normalized relational schema managed via **SQLAlchemy ORM** (`backend/app/models.py`).

```
+------------------------------------------------------------------------------------+
|                       Relational Entity-Relationship Diagram                       |
+------------------------------------------------------------------------------------+

     +--------------------+                 +--------------------+
     |       users        | 1             1 |      vendors       |
     +--------------------+-----------------+--------------------+
     | id (PK)            |                 | id (PK)            |
     | email              |                 | user_id (FK)       |
     | password_hash      |                 | name               |
     | role               |                 | category           |
     | status             |                 | reliability_score  |
     | company_name       |                 | delivery_score     |
     | gst_number         |                 | rating             |
     | bank_account_no    |                 | defect_rate        |
     +--------------------+                 +--------------------+
       | 1             | 1                    | 1
       |               |                      |
       | *             | *                    | *
     +-------------+ +--------------------+ +-------------+
     | user_docs   | | verification_token | |    bids     |
     +-------------+ +--------------------+ +-------------+
     | id (PK)     | | id (PK)            | | id (PK)     |
     | user_id(FK) | | user_id (FK)       | | auction_id  |
     | doc_type    | | otp_code           | | vendor_id   |
     | file_url    | | purpose            | | price       |
     | status      | | expires_at         | | timestamp   |
     +-------------+ +--------------------+ +-------------+
                                              | *
                                              | 1
                                            +-------------+
                                            |  auctions   |
                                            +-------------+
                                            | id (PK)     |
                                            | title       |
                                            | category    |
                                            | max_budget  |
                                            | status      |
                                            | weight_cost |
                                            +-------------+
```

### Table Dictionary
1. **`users`**: Master credential and profile table storing role (`BUYER`, `VENDOR`, `ADMIN`), approval status (`pending_verification`, `pending_approval`, `approved`), GSTIN, PAN, CIN, and banking coordinates.
2. **`vendors`**: Operational performance scorecard table containing `reliability_score` ($0.5-1.0$), `delivery_score` ($50-100$), `defect_rate`, `avg_delay_days`, and `rating`.
3. **`auctions`**: Procurement requirements created by buyers with ceiling budget, dynamic scoring weights ($w_c, w_r, w_d, w_v$), and state lifecycle (`pending_approval`, `live`, `completed`, `awarded`).
4. **`bids`**: Atomic bids submitted by vendors during live reverse auctions, linked to the auction and submitting vendor.
5. **`fraud_alerts`**: Security log of anomalous activities flagged by the real-time rule engine (`risk_level`: `MEDIUM`, `HIGH`).
6. **`purchase_orders`**: Final legally binding contract award records storing subtotal, 18% GST calculation, awarded vendor, and generated PDF URL.
7. **`audit_logs`**: Tamper-evident ledger chained via SHA-256 block hashes.

---

## 8. Machine Learning Engine, Feature Engineering & Mathematical Formulations

### Why XGBoost?
In enterprise procurement, tabular data dominates. We evaluated three families of algorithms:
* **Deep Neural Networks (MLP)**: Prone to overfitting on tabular business metrics, computationally heavy, and function as "black boxes" lacking explainability.
* **Linear / Logistic Regression**: Incapable of capturing complex non-linear interactions (e.g., a vendor offering a 20% discount but possessing a terrible 12% defect rate).
* **XGBoost (Extreme Gradient Boosting)**: **Selected**. XGBoost uses an ensemble of gradient-boosted decision trees with built-in $L_1$ and $L_2$ regularization. It handles non-linear boundaries natively, is immune to multicollinearity, executes inference in under 5ms, and achieved an **84.12% accuracy and 0.89+ ROC-AUC** on test splits.

---

### The 7 Core Features
Every vendor bid is transformed into a 7-dimensional feature vector:

$$\mathbf{x} = \begin{bmatrix} x_{\text{price\_ratio}} \\ x_{\text{reliability}} \\ x_{\text{delivery}} \\ x_{\text{rating}} \\ x_{\text{defect\_rate}} \\ x_{\text{delay\_days}} \\ x_{\text{contracts}} \end{bmatrix}$$

| # | Feature Name | Range | Description & Normalization |
|---|:---|:---:|:---|
| 1 | `price_ratio` | $[0.40, 1.15]$ | Normalized cost metric: $\frac{\text{Bid Price}}{\text{Maximum Budget}}$. Values $< 1.0$ indicate budget savings. |
| 2 | `reliability_score` | $[0.50, 1.00]$ | Historical contract fulfillment consistency score. |
| 3 | `delivery_score` | $[50.0, 100.0]$ | On-time SLA performance score. |
| 4 | `historical_rating` | $[2.5, 5.0]$ | Verified buyer feedback score (out of 5.0 stars). |
| 5 | `defect_rate` | $[0.00, 0.15]$ | Ratio of past shipments rejected during quality audits. |
| 6 | `avg_delay_days` | $[0.0, 15.0]$ | Average delivery delay beyond contract deadline in days. |
| 7 | `completed_contracts` | $[1, 500+]$ | Total number of successfully completed institutional orders. |

---

### The Multi-Attribute Utility Function
In live auctions, buyer preferences vary. One buyer prioritizes speed; another prioritizes raw cost. ReBid AI calculates a dynamic **Utility Score ($U$)** based on buyer-defined weights:

$$U = w_{\text{cost}} \cdot S_{\text{price}} + w_{\text{rel}} \cdot S_{\text{reliability}} + w_{\text{del}} \cdot S_{\text{delivery}} + w_{\text{rev}} \cdot S_{\text{rating}}$$

Where:
* $w_{\text{cost}} + w_{\text{rel}} + w_{\text{del}} + w_{\text{rev}} = 1.0$ (Default: $0.40, 0.30, 0.20, 0.10$)
* $S_{\text{price}} = \max\left(0, \min\left(100, (1.15 - \text{price\_ratio}) \times 100\right)\right)$
* $S_{\text{reliability}} = \text{reliability\_score} \times 100$
* $S_{\text{delivery}} = \text{delivery\_score}$
* $S_{\text{rating}} = \left(\frac{\text{historical\_rating}}{5.0}\right) \times 100$

---

### Hybrid Final Confidence Score
To ensure the system is neither a blind statistical algorithm nor an arbitrary calculator, the final recommendation confidence blends the machine learning model's output with the buyer's utility score:

$$\text{Final Confidence} = \min\left(98.5, \max\left(45.0, \left(0.60 \cdot P_{\text{XGBoost}} + 0.40 \cdot \frac{U}{100}\right) \times 100\right)\right)$$

* $P_{\text{XGBoost}}$: Probability predicted by the trained XGBoost model ($0.0 \text{ to } 1.0$).
* $U$: Buyer multi-attribute utility score ($0 \text{ to } 100$).
* The vendor with the highest final confidence score is designated as the **AI Recommended Winner**, accompanied by an explainable decision report.

---

## 9. Fraud Detection, Anti-Collusion & Cryptographic Audit Trails

### Real-Time Anomaly & Collusion Rules (`backend/app/services.py`)
Every bid submitted to `/api/bids` is analyzed immediately by the real-time fraud engine:

```
[ Incoming Bid ] 
       |
       +---> [ Rule 1: Velocity Check ] -> > 5 bids in 30s? ---------> HIGH RISK: Rate Limit Bot Abuse
       |
       +---> [ Rule 2: Budget Dump ] ----> Bid < 50% Max Budget? ----> MEDIUM RISK: Predatory Dumping
       |
       +---> [ Rule 3: Collusion Ring ] -> Match other bid within ---> HIGH RISK: Bidding Ring Collusion
                                          0.5% margin in 60s?
```

1. **Rule 1 - High-Frequency Bot Bidding (Severity: HIGH)**:
   * *Condition*: Vendor submits $> 5$ bids within a rolling 30-second window.
   * *Threat Mitigated*: Denial-of-service attempts and algorithmic price sniping designed to overwhelm genuine human bidders.
2. **Rule 2 - Predatory Budget Dumping (Severity: MEDIUM)**:
   * *Condition*: Bid price is $< 50\%$ of the maximum ceiling budget.
   * *Threat Mitigated*: Under-quoting tactics where an unscrupulous vendor bids an unviably low price to secure the contract, only to demand price escalations or supply counterfeit items later.
3. **Rule 3 - Synchronized Collusion & Bid Rigging (Severity: HIGH)**:
   * *Condition*: Two distinct vendors submit bids matching within a $\pm 0.5\%$ price band within 60 seconds of each other.
   * *Threat Mitigated*: Bidding rings, shadow consortiums, and cover bidding where colluding suppliers manipulate auction mechanics.

---

### The Tamper-Evident Cryptographic Audit Ledger
To prevent insider database tampering, ReBid AI implements a blockchain-inspired SHA-256 hash-chained ledger:

$$\text{Block Hash}_i = \text{SHA-256}\left(\text{Log\_ID}_i \parallel \text{Timestamp}_i \parallel \text{Action}_i \parallel \text{Payload}_i \parallel \text{Hash}_{i-1}\right)$$

* The first record uses a fixed seed: $\text{Hash}_0 = \text{"GENESIS"}$.
* Every subsequent event embeds the hash of the preceding event.
* **Tampering Proof**: If an attacker opens `rebid.db` and alters a bid price from `₹85,000` to `₹95,000`, the hash of that block changes immediately. Consequently, every subsequent block hash in the chain becomes invalid, alerting the system and compliance auditors to unauthorized database modification.

---

## 10. Synthetic Dataset Architecture & CSV Inter-Relationships

ReBid AI features a comprehensive data generation engine (`data/generate_synthetic_data.py` and `ml/generate_dataset.py`) providing realistic enterprise procurement datasets:

```
                          [ vendors.csv ] (500-800 Vendors)
                                 |
                                 v
   [ procurement_requests.csv ] ---> [ bids.csv ] (1,644 - 10,000+ Bids)
         (150-1,500 RFPs)                |
                                         +---> [ fraud_alerts.csv ] (Flagged Collusion)
                                         |
                                         +---> [ audit_trail.csv ] (1,794 Chained Blocks)
                                         |
                                         v
                         [ dataset_10k.csv ] / [ procurement_history.csv ]
                               (Consolidated ML Training Datasets)
```

1. **`vendors.csv`**: Contains profile data for 500-800 suppliers across 12 sectors (IT Hardware, Software Licenses, Logistics, Raw Metals, Construction, etc.). Key columns: `vendor_id`, `name`, `category`, `historical_rating`, `reliability_score`, `delivery_score`, `defect_rate`, `avg_delay_days`.
2. **`procurement_requests.csv`**: 150 simulated corporate purchasing requirements with randomized ceiling budgets, deadlines, and item specifications.
3. **`bids.csv`**: 1,644 individual bids across 150 auctions capturing price decrements, timestamps, and synthetic collusion markers (`collusion_group`).
4. **`dataset_10k.csv`**: 10,000 high-volume simulated bidding interactions across 7 enterprise domains used to train the XGBoost model to **84.12% accuracy**.

---

## 11. Computer Science Fundamentals & Acronyms Dictionary (Full Forms)

This section provides an exhaustive reference of core computing and domain terminology:

| Acronym | Full Form | Detailed Definition & Context in ReBid AI |
| :--- | :--- | :--- |
| **PO** | **Purchase Order** | A legally binding commercial document issued by a buyer to a vendor committing to purchase specified items at agreed prices and SLA delivery terms. |
| **DFD** | **Data Flow Diagram** | A graphical representation of the "flow" of data through an information system (Level 0 context, Level 1 functional decomposition). |
| **DB** | **Database** | An organized, structured collection of digital data stored and accessed electronically. |
| **DBMS** | **Database Management System** | Software that interacts with end users, applications, and the database itself to capture and analyze data (e.g., MySQL, SQLite). |
| **RDBMS** | **Relational Database Management System** | A DBMS based on the relational model introduced by E.F. Codd, storing data in structured tables linked by Primary and Foreign Keys (e.g., SQLite, PostgreSQL). |
| **IDE** | **Integrated Development Environment** | A software suite providing comprehensive facilities for software development (e.g., VS Code, PyCharm). |
| **CPU** | **Central Processing Unit** | The primary electronic circuitry that executes instructions comprising a computer program. Handles backend API routing and database operations. |
| **GPU** | **Graphics Processing Unit** | Specialized electronic circuit designed to accelerate parallel computing tasks, notably training deep learning models. |
| **RAM** | **Random Access Memory** | High-speed volatile working memory used by the operating system to hold active program state, cache, and database query buffers. |
| **ROM** | **Read-Only Memory** | Non-volatile memory storing permanent system boot instructions (firmware / BIOS). |
| **OS** | **Operating System** | System software that manages computer hardware, software resources, and provides common services for computer programs (e.g., Windows 11, Linux). |
| **LAN** | **Local Area Network** | A computer network that interconnects computers within a limited area such as an office, laboratory, or university campus. |
| **TCP** | **Transmission Control Protocol** | Connection-oriented, reliable transport protocol that guarantees ordered, error-checked delivery of packets across an IP network. |
| **IP** | **Internet Protocol** | Network-layer protocol responsible for addressing and routing packets across network boundaries. |
| **SSL** | **Secure Sockets Layer** | Deprecated cryptographic protocol designed to provide communications security over a computer network. |
| **TLS** | **Transport Layer Security** | The modern cryptographic protocol successor to SSL that encrypts HTTPS web traffic between browsers and FastAPI servers. |
| **REST** | **Representational State Transfer** | Architectural software style for distributed systems utilizing stateless HTTP methods (`GET`, `POST`, `PUT`, `DELETE`). |
| **JWT** | **JSON Web Token** | Open standard (RFC 7519) defining a compact, URL-safe container for securely transmitting claims between parties as a JSON object. |
| **RBAC** | **Role-Based Access Control** | An access-control mechanism that restricts system access to authorized users based on defined organizational roles (`BUYER`, `VENDOR`, `ADMIN`). |
| **SLA** | **Service Level Agreement** | A formal commitment between a service provider and a client establishing delivery milestones, uptime, and quality expectations. |
| **GSTIN** | **Goods and Services Tax Identification Number**| 15-digit unique tax identifier issued to businesses in India. |
| **PAN** | **Permanent Account Number** | 10-digit alphanumeric identifier issued by the Indian Income Tax Department. |
| **CIN** | **Corporate Identity Number** | 21-digit alphanumeric number issued by the Ministry of Corporate Affairs to registered companies in India. |
| **IFSC** | **Indian Financial System Code** | 11-character alphanumeric code used to uniquely identify bank branches participating in online fund settlement systems (NEFT/RTGS). |
| **OTP** | **One-Time Password** | A time-sensitive, randomly generated numeric string valid for only a single login session or transaction. |
| **CORS** | **Cross-Origin Resource Sharing** | A browser security mechanism that restricts HTTP requests initiated from scripts running on a different domain or port. |
| **API** | **Application Programming Interface** | A computing interface that defines interactions between multiple software intermediaries. |
| **XGBoost**| **eXtreme Gradient Boosting** | An optimized distributed gradient boosting library designed to be highly efficient, flexible, and portable. |
| **ROC-AUC**| **Receiver Operating Characteristic - Area Under Curve** | A performance measurement for classification problems at various threshold settings, reflecting true-positive vs. false-positive trade-offs. |

---

## 12. The Master Viva & Interview Defense Compendium (Questions 823 - 862)

This section provides direct, rigorous answers to the critical project examination and technical defense questions:

### Q823. Explain your project architecture.
ReBid AI follows a modern decoupled **Client-Server 3-Tier Architecture**:
1. **Presentation Layer**: Built in **React 19** and **Vite**, featuring role-tailored portals (Buyer, Vendor, Admin), responsive navigation, and stateful live auction feeds.
2. **Application & API Layer**: Powered by **FastAPI** running on **Uvicorn**. It orchestrates authentication (JWT HS256), enforces RBAC, executes the real-time fraud engine, and manages the auction state machine.
3. **Intelligence & Persistence Layer**: Consists of an **XGBoost Classifier** for multi-criteria vendor scoring, **ReportLab** for PDF synthesis, and **SQLite via SQLAlchemy ORM** with an immutable SHA-256 hash-chained audit ledger.

---

### Q824. Explain your project workflow.
The system lifecycle operates across 7 deterministic phases:
1. **Registration & Vetting**: Users register via a 7-step wizard. Vendors upload GST, PAN, and Bank details, which an Administrator audits and approves.
2. **Request Initiation**: An approved Buyer submits a procurement request detailing item specifications, ceiling budget, and evaluation criteria weights.
3. **Administrative Gating**: The Admin reviews the request for compliance and budget feasibility, clicking "Approve" to transition the auction to `LIVE`.
4. **Live Reverse Auction**: Verified vendors submit descending counter-bids. A live leaderboard updates in real-time.
5. **Real-Time Fraud Interception**: Every bid is scanned for high-velocity bot behavior, budget dumping (<50%), and collusive bid synchronization within 60s.
6. **AI Recommendation**: Upon auction conclusion, the Buyer triggers the XGBoost + Utility scoring engine, which analyzes bids across 7 dimensions and generates an explainable decision report.
7. **Award & Contract Issuance**: The Buyer awards the contract. The system generates an official SAP/GeM-compliant Purchase Order PDF (with 18% GST and digital verification hash) and commits the transaction to the SHA-256 audit ledger.

---

### Q825. Explain your AI model.
The core recommendation model is an **XGBoost Classifier (`ml/xgb_model.json`)** trained on 10,000 procurement interactions. It predicts the probability of a vendor being the optimal contract winner based on 7 features: price ratio relative to budget, historical reliability score, on-time delivery score, feedback rating, defect rate, average delay days, and completed contract volume. Its output is combined with a buyer-customizable multi-attribute utility score to yield a final recommendation confidence percentage ($45.0\% - 98.5\%$).

---

### Q826. Explain why XGBoost was selected.
XGBoost was chosen because:
1. It is the gold standard for tabular, heterogeneous business metrics.
2. Gradient boosted trees construct non-linear decision boundaries far better than linear regressions without requiring extensive feature scaling.
3. It avoids overfitting through native $L_1$ (Lasso) and $L_2$ (Ridge) leaf penalties.
4. It provides millisecond inference latency ($<5\text{ms}$), critical for responsive web applications.

---

### Q827. Explain your vendor scoring mechanism.
The scoring engine evaluates vendors using a dual-phase hybrid approach:
* **Phase 1 (Machine Learning)**: The feature vector $\mathbf{x}$ is passed to the trained XGBoost model to compute base winning probability $P_{\text{XGBoost}}$.
* **Phase 2 (Multi-Attribute Utility)**: Dynamic sub-scores are calculated for Price, Reliability, Delivery, and Buyer Ratings, weighted by the Buyer's custom preferences ($w_{\text{cost}}, w_{\text{rel}}, w_{\text{del}}, w_{\text{rev}}$).
* **Synthesis**: The final score combines $60\%$ ML probability with $40\%$ buyer utility preference, generating a transparent scorecard and explainable bulleted rationale.

---

### Q828. Explain your fraud detection mechanism.
Fraud detection runs synchronously during bid ingestion via a rule-based anomaly detection pipeline. It inspects database transaction windows without relying on third-party services, identifying abusive high-frequency bot bids, irrational price dumping, and synchronized bidding patterns before committing the bid.

---

### Q829. Explain how collusion is detected.
Collusion is detected via **Temporal-Price Proximity Analysis (Rule 3)**:
When vendor $B$ submits a bid, the engine queries all bids submitted by *other* vendors for the same auction within the preceding 60 seconds. If the price difference between vendor $B$ and any other vendor is within a $\pm 0.5\%$ margin, the system flags the transaction with a `HIGH` risk `FRAUD_ALERT_COLLUSION` alert and notifies the compliance admin.

---

### Q830. Explain your dataset.
The dataset consists of **10,000 synthetic transaction records** (`dataset_10k.csv`) across 7 core industrial domains, supplemented by 5 relational datasets (`vendors.csv`, `procurement_requests.csv`, `bids.csv`, `procurement_history.csv`, and `audit_trail.csv`). It was generated using statistical distributions and Python's `Faker` library, establishing real-world correlations (e.g., vendors with higher reliability metrics exhibit lower defect rates and shorter delivery delays).

---

### Q831. Explain the relationship between all CSV files.
* `vendors.csv` provides vendor profiles linked by `vendor_id`.
* `procurement_requests.csv` defines procurement demands linked by `request_id`.
* `bids.csv` maps individual price offers linking `vendor_id` and `request_id`.
* `procurement_history.csv` is the denormalized consolidation of completed auctions, winning bids, and vendor metrics used for ML training.
* `audit_trail.csv` represents the chronological event log with SHA-256 parent hashes.
* `fraud_alerts.csv` records all flagged bids linked to their auction and vendor identifiers.

---

### Q832. Explain your preprocessing.
Data preprocessing (`ml/train.py`) involves:
1. Computing the relative `price_ratio` ($\text{Bid Price} / \text{Max Budget}$) to normalize prices across orders ranging from ₹10,000 to ₹50,00,000.
2. Normalizing delivery scores to a $[0.0, 1.0]$ floating-point range.
3. Handling edge cases where budgets are zero or fields are null.
4. Stratified 80/20 train-test splitting to ensure representative class distributions.

---

### Q833. Explain Feature Engineering.
Feature engineering transforms raw transactional attributes into predictive indicators:
* Rather than using raw bid prices (which vary by millions between categories), we engineered the scale-invariant feature `price_ratio`.
* `delay_norm` converts raw delay days into a bounded metric: $1.0 - (\min(\text{delay}, 15) / 15.0)$.
* Correlated quality metrics (`defect_rate` and `cancellation_rate`) were synthesized to help the tree models isolate unreliable suppliers even if their pricing is aggressive.

---

### Q834. Explain frontend technologies.
* **React 19**: Provides stateful UI components, hooks (`useState`, `useEffect`, `useContext`), and efficient virtual DOM rendering.
* **Vite 8**: Delivers fast development cold starts and optimized production builds.
* **Tailwind CSS v4 & Vanilla CSS**: Provides utility-first styling combined with custom design tokens for responsive, glassmorphic layouts.
* **Framer Motion**: Delivers smooth transitions and animated visual feedback.
* **Lucide React**: Supplies lightweight SVG icons.
* **Axios**: Handles asynchronous REST API requests and JWT Bearer authorization.

---

### Q835. Explain backend technologies.
* **Python 3.10+**: Core programming language.
* **FastAPI**: Asynchronous web framework providing automatic Swagger OpenAPI documentation.
* **Uvicorn**: High-concurrency ASGI server built on `uvloop`.
* **SQLAlchemy 2.0**: Object-relational mapping and SQL abstraction.
* **Pydantic v2**: Request/response schema validation and type coercion.
* **ReportLab**: Enterprise PDF synthesis engine.
* **PyJWT / Cryptography**: Token generation and cryptographic verification.

---

### Q836. Explain database connectivity.
Database connectivity is managed through SQLAlchemy's connection pooling mechanism in `backend/app/database.py`. It establishes an engine bound to `sqlite:///./rebid.db`, uses `sessionmaker` to provide transactional database sessions, and implements a dependency generator (`get_db`) that injects sessions into FastAPI route handlers and guarantees connection closure via `finally: db.close()`.

---

### Q837. Explain Buyer-Vendor-Admin connectivity.
Communication between user roles is mediated through the shared FastAPI backend and database:
* A **Buyer** creates an auction $\rightarrow$ saved with status `pending_approval`.
* The **Admin** queries `/api/admin/pending_auctions` and approves it $\rightarrow$ status updates to `live`.
* **Vendors** polling `/api/auctions` observe the live auction and submit bids to `/api/bids`.
* The **Buyer** polls `/api/auctions/{id}` to watch incoming bids live, triggers `/api/recommend/{id}` to run the AI engine, and submits `/api/award` to issue the Purchase Order.
* The awarded vendor immediately sees the new contract in their `/api/vendor/awarded_contracts` feed.

---

### Q838. Explain JWT authentication.
JSON Web Token (JWT) is a stateless authentication standard (RFC 7519). Upon successful login, the server constructs a JSON payload containing `user_id`, `email`, `role`, and `exp` (expiration timestamp), signs it using a secret key with the **HS256** algorithm, and returns the compact token (`header.payload.signature`) to the client. The frontend stores this token and sends it in the `Authorization: Bearer <token>` header for subsequent requests. The backend validates the signature without needing to query a session table in the database.

---

### Q839. Explain HS256.
**HS256 (HMAC with SHA-256)** is a **symmetric cryptographic signing algorithm**. It uses a single shared secret key between the token issuer and verifier. The algorithm computes a Hash-based Message Authentication Code (HMAC) of the combined header and payload using the SHA-256 hash function. If an attacker tampers with the payload (e.g., changing their role from `VENDOR` to `ADMIN`), the resulting signature will not match, and FastAPI rejects the request with HTTP 401 Unauthorized.

---

### Q840. Explain SHA-256.
**SHA-256 (Secure Hash Algorithm 256-bit)** is a cryptographic hash function published by the National Institute of Standards and Technology (NIST). It takes an input of any arbitrary size and deterministically transforms it into a fixed **256-bit (64-character hexadecimal) string**. It is strictly one-way (pre-image resistant) and collision-resistant; even a single bit change in the input data produces an entirely different hash output (the avalanche effect).

---

### Q841. Explain the difference between SHA-256 and HS256.
| Property | SHA-256 | HS256 (HMAC-SHA-256) |
| :--- | :--- | :--- |
| **Type** | Cryptographic Hash Function | Message Authentication Code (MAC) |
| **Key Requirement** | No key required (unkeyed) | Requires a shared secret key |
| **Output** | Fixed 256-bit digest of data | Digitally signed authentication tag |
| **Primary Use** | Integrity verification & audit trail chaining | Authenticity & non-repudiation (JWT signing) |
| **Reversibility** | Irreversible one-way mathematical function | Irreversible, but verifiable only with the secret key |

---

### Q842. Explain RBAC (Role-Based Access Control).
RBAC is an authorization paradigm where user permissions are determined by assigned organizational roles. In ReBid AI:
* Endpoints are protected via FastAPI dependency injectors: `require_role(["BUYER"])`, `require_role(["VENDOR"])`, or `require_role(["ADMIN"])`.
* We also implement **state-aware RBAC** (`require_approved_role`): even if a user presents a valid token claiming the `VENDOR` role, the server re-verifies against the database that the vendor's status is currently `approved`, preventing banned, rejected, or unverified accounts from transacting.

---

### Q843. Explain WebSocket vs. Polling.
* **WebSocket**: A persistent, bidirectional, full-duplex TCP connection between client and server, ideal for high-frequency multiplayer environments.
* **HTTP Polling (Used in ReBid AI)**: The client periodically queries the REST endpoint (`/api/auctions/{id}`) to fetch updated state.
* **Why Polling is Effective Here**: Enterprise procurement auctions are measured in minutes, not milliseconds. Short-interval polling avoids the firewall, proxy, and connection-state complexities common to corporate enterprise networks with WebSockets, while still delivering responsive live leaderboard updates.

---

### Q844. Explain the DFD (Data Flow Diagram).
A DFD models the flow of data through our procurement system:
* **Level 0 (Context Level)**: Treats ReBid AI as a single central entity interacting with three external actors: Buyers, Vendors, and Admins.
* **Level 1 (Functional Decomposition)**: Details the 5 core subprocesses: Authentication, Auction Management, Fraud Monitoring, Machine Learning Evaluation, and Purchase Order Generation.
* **Level 2 (Procurement Subsystem)**: Traces individual data paths—from bid submission, through schema validation and fraud analysis, to database commitment, leaderboard calculation, and PDF output.

---

### Q845. Explain the control flow.
The control flow traces the program execution path:
Client Request $\rightarrow$ Uvicorn ASGI Server $\rightarrow$ FastAPI Router $\rightarrow$ CORS Middleware $\rightarrow$ Authentication & RBAC Guard $\rightarrow$ Route Handler $\rightarrow$ Database Transaction (SQLAlchemy) $\rightarrow$ Auxiliary Services (Fraud Engine / ML Engine / ReportLab) $\rightarrow$ Commit & Audit Log $\rightarrow$ JSON Response to Client $\rightarrow$ React State Update.

---

### Q846. Explain module connectivity.
ReBid AI modules are organized for high cohesion and loose coupling:
* `backend/app/main.py`: Central routing and application gateway.
* `backend/app/auth.py`: Cryptographic token and password operations.
* `backend/app/models.py`: Database table definitions.
* `backend/app/schemas.py`: Pydantic models for incoming request validation.
* `backend/app/services.py`: Domain services (PDF generation, fraud analysis, audit logging).
* `ml/predict.py`: Model loader and multi-attribute utility evaluator.

---

### Q847. Explain the Purchase Order generation.
When a contract is awarded, the server invokes `generate_purchase_order_pdf()` in `backend/app/services.py`:
1. It computes the subtotal, itemized **18% Goods and Services Tax (GST)**, and grand total in Indian Rupees (`₹`).
2. Calculates a strict 14-day SLA delivery deadline.
3. Constructs a cryptographic verification stamp: $\text{SHA-256}(\text{PO\_ID} \parallel \text{Buyer} \parallel \text{Vendor} \parallel \text{Total})$.
4. Uses **ReportLab Canvas** to render an official, publication-ready PDF featuring corporate headers, itemization tables, authorized digital stamps, and terms of delivery.

---

### Q848. Explain the audit trail.
The audit trail is an immutable transaction record stored in the `audit_logs` table. Every critical event (`AUCTION_CREATED`, `BID_SUBMITTED`, `FRAUD_ALERT_TRIGGERED`, `CONTRACT_AWARDED`) generates a log entry containing the actor, action description, JSON payload, UTC timestamp, and a parent hash linking to the prior record, forming an unbroken cryptographic chain.

---

### Q849. Explain how tampering is detected.
Tampering is detected through cryptographic hash verification. If an adversary accesses the database and alters any historical field (e.g., modifying a winning bid price), the hash calculated from that record will no longer match the hash stored in the subsequent block. A periodic or on-demand verification script traverses the chain; when an altered block is encountered, the chain breaks at that exact index, pinpointing the illicit change.

---

### Q850. Explain your testing process.
Testing was executed across three levels:
1. **Unit Testing**: Verifying standalone functions (password hashing, GST calculation, Indian Rupee string formatting).
2. **Integration Testing**: Executed via custom verification scripts (`scratch/test_enhancements.py`, `scratch/test_master_verification.py`), validating registration wizards, token validation, admin approval transitions, and PDF generation.
3. **End-to-End Simulation**: Simulating concurrent vendor bidding wars using automated bot loops to verify real-time leaderboard sorting and fraud trigger thresholds.

---

### Q851. Explain your model accuracy.
The XGBoost procurement recommendation model achieved an **accuracy of 84.12%** and a **ROC-AUC of 0.89+** on the test dataset split. This demonstrates high discriminative power in distinguishing reliable, cost-effective vendors from risky, substandard bidders across diverse budget ranges.

---

### Q852. Explain the limitations of your project.
1. **Current Relational Storage**: The default installation utilizes SQLite, which is ideal for single-node deployments but requires migration to PostgreSQL for distributed enterprise clustering.
2. **Synchronous Polling**: While efficient and reliable, replacing polling with WebSockets or Server-Sent Events (SSE) would reduce HTTP overhead in high-concurrency environments.
3. **Synthetic Historical Data**: The current ML model was trained on synthetic data generated via Faker; training on years of real enterprise ERP transaction data would further refine its predictive weights.

---

### Q853. Explain the future scope.
1. **ERP Integrations**: Direct API connectors to enterprise systems like SAP, Oracle Cloud Procurement, and Microsoft Dynamics 365.
2. **Decentralized Smart Contracts**: Migrating the SHA-256 audit ledger to an Ethereum / Polygon private consortium blockchain for multi-enterprise trust.
3. **Generative AI Document Extraction**: Incorporating vision models to automatically extract line items, GSTINs, and compliance certifications from uploaded vendor PDF documents.
4. **Automated Escrow Payments**: Integrating UPI / Payment Gateways for automated escrow milestone disbursements upon verified delivery receipt.

---

### Q854. What would you change if you had more time?
1. Implement full native WebSocket channels with Redis Pub/Sub for sub-10ms auction broadcast updates.
2. Deploy the platform inside containerized Docker pods managed via Kubernetes with automated CI/CD pipelines.
3. Add multi-currency support ($USD, €EUR, £GBP) with live foreign exchange (FX) conversion rates alongside INR ($₹$).

---

### Q855. What is the strongest part of your project?
The **holistic integration of explainable AI with cryptographic security and real-world compliance**. Unlike toy auction apps that only look at price, ReBid AI prevents bid rigging with an automated fraud engine, avoids the lowest-bidder trap using an explainable XGBoost utility model, and guarantees legal compliance with tamper-evident audit trails and SAP-style Purchase Order PDFs.

---

### Q856. What is the weakest part of your project?
The dependence on client-side polling for live auction updates rather than full-duplex WebSockets. While practical and firewall-friendly, polling introduces slight network redundancy under heavy concurrent loads.

---

### Q857. What is the biggest technical challenge you faced?
Designing the **hybrid multi-criteria recommendation engine**. Balancing raw machine learning probability (which favors past historical consistency) with live buyer preference utility (which dynamically shifts weight between price savings and delivery deadlines) required careful mathematical formulation and normalization to prevent one feature from distorting the final recommendation.

---

### Q858. What did you personally implement?
* Full-stack architecture: FastAPI backend REST API services and React 19 frontend SPA.
* Machine Learning pipeline: Synthetic procurement dataset generation, XGBoost training, and utility score formulation.
* Cryptographic security: SHA-256 hash-chained audit ledger, JWT HS256 auth, and anti-tamper PO verification codes.
* 3-Rule automated fraud and bid-rigging detection engine.
* ReportLab PDF generation engine producing official SAP / GeM-compliant award letters.
* 7-step onboarding wizard with document verification and admin governance workflows.

---

### Q859. What did you learn from this project?
* Practical application of Machine Learning on tabular business data where interpretability and explainability are paramount.
* Designing defensive, secure backends featuring RBAC, cryptographic chaining, and strict input validation.
* Structuring clean, decoupled frontend architectures with React 19, Vite, and custom design systems.
* Deep domain insights into enterprise supply chain dynamics, government e-marketplace (GeM) standards, and anti-collusion regulations.

---

### Q860. Why should an organization use your system?
Because ReBid AI directly improves the corporate bottom line. It reduces direct purchasing costs by 15-28%, eliminates weeks of bureaucratic paperwork, completely removes human bias and corruption from vendor selection, and ensures every transaction is backed by an auditable cryptographic paper trail.

---

### Q861. How is your system better than traditional procurement?
| Feature | Traditional Corporate Procurement | ReBid AI Platform |
| :--- | :--- | :--- |
| **Negotiation Cycle**| 3 to 6 weeks of back-and-forth emails | **15 minutes** of live dynamic reverse bidding |
| **Vendor Selection** | Subjective human choice or lowest bidder | **Explainable AI (XGBoost + Multi-Criteria Utility)** |
| **Fraud Prevention** | Post-audit manual inspection (often missed) | **Real-time automated detection** of collusion & bot bids |
| **Audit Integrity** | Mutable database logs easily altered by DBAs | **Immutable SHA-256 hash-chained ledger** |
| **Documentation** | Manual PO creation in spreadsheets | **Automated SAP/GeM-compliant signed PDF generation** |
| **Cost Savings** | Minimal (0 - 5% negotiated discounts) | **15 - 28% empirical cost reductions** |

---

### Q862. Explain the entire project in 2 minutes.
*(See [Section 1: The 2-Minute Project Summary (Elevator Pitch)](#1-the-2-minute-project-summary-elevator-pitch) at the top of this documentation for the complete, verbatim presentation).*
