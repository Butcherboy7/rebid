# ReBid AI Dataset Documentation

This directory contains the documentation for the synthetically generated procurement datasets used in **ReBid AI**. 

The dataset is designed to train and evaluate:
1. **AI-Based Multi-Criteria Vendor Scoring Engine** (using XGBoost/LightGBM).
2. **Fraud & Bid Collusion Anomaly Detection**.
3. **Tamper-Evident Cryptographic Audit Trail Validation**.

---

## Dataset Overview

The dataset consists of 5 CSV files located in `data/csv/`:

1. **`vendors.csv`**: Profile information for 500 simulated vendors.
2. **`procurement_requests.csv`**: 150 procurement requirements posted by buyers.
3. **`bids.csv`**: 1,644 individual bids submitted during live reverse auctions.
4. **`procurement_history.csv`**: Consolidated historical dataset for training recommendation models.
5. **`audit_trail.csv`**: Cryptographically hash-chained transaction logs.
6. **`fraud_alerts.csv`**: Flagged bidding collusion alerts.

---

## 1. Vendor Profiles (`vendors.csv`)

This dataset contains **500 vendor profiles** distributed across 12 distinct product/service categories.

| Column | Type | Description |
| :--- | :--- | :--- |
| `vendor_id` | String | Unique identifier (e.g., `VND-0001` to `VND-0500`). |
| `name` | String | B2B Company name (Faker generated). |
| `category` | String | Industry sector (1 of 12 distinct categories). |
| `historical_rating` | Float | Reputation rating (3.76 to 5.00). |
| `reliability_score` | Float | Probability of meeting contract terms (0.5 to 1.0). |
| `avg_delay_days` | Float | Average past delivery delay in days. |
| `defect_rate` | Float | Percentage of past items containing defects (0.0% to 15.0%). |
| `historical_completion_rate` | Float | Percentage of past contracts completed successfully. |

*Note: Vendor metrics are correlated (e.g., higher ratings correspond to higher reliability, lower delays, and lower defect rates) to mirror real-world business dynamics.*

---

## 2. Bids Logs (`bids.csv`)

This dataset captures the **1,644 individual bids** submitted across the live reverse auctions.

| Column | Type | Description |
| :--- | :--- | :--- |
| `bid_id` | String | Unique identifier (e.g., `BID-00001`). |
| `request_id` | String | Linked procurement request. |
| `vendor_id` | String | Submitting vendor. |
| `bid_price` | Float | Bid value. Decreases progressively during the reverse auction. |
| `bid_timestamp` | DateTime | Timestamp when the bid was submitted. |
| `is_fraudulent_flag` | Integer | Binary label (1 = Collusive, 0 = Normal) for training collusion detection models. |
| `collusion_group` | String | Identification token for colluding bidding rings (null if normal). |

---

## 3. Unified Procurement History (`procurement_history.csv`)

This is the consolidated dataset (150 rows) representing completed procurement requests. It merges request parameters, winning vendor metrics, and the winning bid price.

### Utility Score Formula
The **AI Recommendation Score** (target variable `ai_recommendation_score` ranging from 0 to 100) is calculated using a multi-attribute utility function:

$$\text{Utility} = 0.4 \times (1 - \frac{\text{Bid Price}}{\text{Max Budget}}) + 0.3 \times \text{Reliability} + 0.2 \times (1 - \frac{\text{Delay Days}}{15}) + 0.1 \times (1 - \text{Defect Rate})$$

This ensures that the recommended vendor is selected based on a balanced trade-off between cost, reliability, delivery, and quality.

---

## 4. Tamper-Evident Audit Trail (`audit_trail.csv`)

A ledger consisting of **1,794 logged events** (request creation, bid submission) chained together using SHA-256 cryptographic hashes.

$$\text{Block Hash} = \text{SHA-256}(\text{log\_id} \parallel \text{timestamp} \parallel \text{action} \parallel \text{payload} \parallel \text{previous\_hash})$$

If any bid price is altered or a record is removed in the database, the hash chain breaks, marking the audit trail invalid.
