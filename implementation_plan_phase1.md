# Implementation Plan - Phase 1: Critical Demo Requirements

Focuses on activating the trained XGBoost ML model binary, fixing database concurrency locks under fast polling, displaying live fraud risk badges on the buyer leaderboard, and rendering dynamic vendor rank movement indicators.

---

## 🎯 Proposed Changes

### Component 1: Machine Learning & XGBoost Model Activation
#### [NEW] [xgb_model.json](file:///e:/rebid%20neha/ml/xgb_model.json)
#### [MODIFY] [train.py](file:///e:/rebid%20neha/ml/train.py)
#### [MODIFY] [predict.py](file:///e:/rebid%20neha/ml/predict.py)
- **Changes**: Run `python ml/train.py` to train the XGBoost classifier on `data/csv/vendors.csv` and export `ml/xgb_model.json`.
- **Outcome**: `ProcurementAI.load_model()` will load the trained XGBoost binary cleanly without falling back to heuristic constants.

---

### Component 2: Database Concurrency & Lock Prevention
#### [MODIFY] [database.py](file:///e:/rebid%20neha/backend/app/database.py)
- **Changes**: Update SQLAlchemy engine connection arguments to include timeout configuration:
  ```python
  engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False, "timeout": 30})
  ```
- **Outcome**: Eliminates `sqlite3.OperationalError: database is locked` during rapid 2-second background polling and bot bid insertions.

---

### Component 3: Buyer Live Fraud Warning Badges
#### [MODIFY] [main.py](file:///e:/rebid%20neha/backend/app/main.py)
#### [MODIFY] [BuyerDashboard.jsx](file:///e:/rebid%20neha/frontend/src/pages/buyer/BuyerDashboard.jsx)
- **Changes**: Enrich `GET /api/auctions/{auction_id}` to check for associated fraud alerts for each bid/vendor. Display `⚠️ HIGH RISK BID` or `⚠️ SUSPICIOUS PRICE` warning pills directly inside the Buyer's Live Leaderboard table rows.

---

### Component 4: Dynamic Vendor Rank Shift Calculation
#### [MODIFY] [VendorDashboard.jsx](file:///e:/rebid%20neha/frontend/src/pages/vendor/VendorDashboard.jsx)
- **Changes**: Compare current vendor rank against previous polling rank state. Dynamically compute and display animated movement tags: `🥈 #2 Winner (↑ Moved up from #4)` or `🔻 #4 (Lost rank)`.

---

## 🧪 Verification Plan

### Automated Verification
- Run `python ml/train.py` and verify `ml/xgb_model.json` is generated.
- Run `scratch/test_backend.py` to verify auth, bidding, fraud detection, and AI recommendations pass 100%.

### Manual Verification
- Test Buyer Leaderboard: Submit a bid `< 50% budget` from vendor portal -> Verify `⚠️ SUSPICIOUS PRICE` badge appears on buyer leaderboard.
- Test Vendor Rank Shift: Place a counter-bid -> Verify rank tag smoothly updates to `(↑ Moved up from #N)`.
