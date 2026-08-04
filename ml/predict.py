import os
import json
import numpy as np
from typing import List, Dict, Any

ML_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(ML_DIR, "xgb_model.json")

class ProcurementAI:
    def __init__(self):
        self.model = None
        self.load_model()

    def load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                from xgboost import XGBClassifier
                self.model = XGBClassifier()
                self.model.load_model(MODEL_PATH)
                print(f"[XGBoost] Model loaded successfully from {MODEL_PATH}")
            except Exception as e:
                print(f"[XGBoost] Warning: Could not load model: {e}")
                self.model = None
        else:
            print(f"[XGBoost] Warning: Model file {MODEL_PATH} not found.")

    def evaluate_vendors(self, budget: float, bids: List[Dict[str, Any]], weights: Dict[str, float]) -> Dict[str, Any]:
        """
        bids: list of dicts with keys [vendor_id, name, price, reliability_score, delivery_score, rating, defect_rate, avg_delay_days, contracts_completed]
        weights: dict with keys [cost, reliability, delivery, reviews] totaling 100
        """
        if not bids:
            return {
                "auction_id": "",
                "recommended_vendor": None,
                "confidence_percentage": 0.0,
                "ranking_list": [],
                "decision_report": None
            }

        w_cost = float(weights.get("cost", 40)) / 100.0
        w_rel = float(weights.get("reliability", 30)) / 100.0
        w_del = float(weights.get("delivery", 20)) / 100.0
        w_rev = float(weights.get("reviews", 10)) / 100.0

        features = []
        for b in bids:
            price_ratio = float(b["price"] / budget) if budget > 0 else 1.0
            features.append([
                price_ratio,
                float(b.get("reliability_score", 0.90)),
                float(b.get("delivery_score", 90.0)),
                float(b.get("rating", 4.5)),
                float(b.get("defect_rate", 0.01)),
                float(b.get("avg_delay_days", 1.0)),
                float(b.get("contracts_completed", 50))
            ])

        X = np.array(features, dtype=np.float32)

        # Base XGBoost Probabilities
        if self.model:
            try:
                raw_preds = self.model.predict_proba(X)[:, 1]
                base_probs = [float(p) for p in raw_preds]
            except Exception:
                base_probs = [0.85 for _ in bids]
        else:
            base_probs = [0.85 for _ in bids]

        ranked_items = []
        for idx, b in enumerate(bids):
            p_ratio = features[idx][0]
            rel = features[idx][1]          # 0.0 - 1.0
            deliv = features[idx][2] / 100.0 # 0.0 - 1.0
            rev = features[idx][3] / 5.0     # 0.0 - 1.0

            # Sub-scores (0 to 100)
            price_score = round(max(0.0, min(100.0, (1.15 - p_ratio) * 100.0)), 1)
            reliability_score = round(rel * 100.0, 1)
            delivery_score = round(deliv * 100.0, 1)
            history_score = round(rev * 100.0, 1)

            # Combined Utility Score
            utility = (
                w_cost * (price_score / 100.0) +
                w_rel * rel +
                w_del * deliv +
                w_rev * rev
            )

            # Final Confidence: 60% XGBoost ML confidence + 40% Buyer preference utility
            final_confidence = round(float(min(98.5, max(45.0, (0.6 * base_probs[idx] + 0.4 * utility) * 100.0))), 1)

            # Risk Assessment
            overall_risk = "LOW"
            if p_ratio > 1.0 or rel < 0.80 or deliv < 0.80:
                overall_risk = "MEDIUM"
            if p_ratio < 0.50 or rel < 0.70:
                overall_risk = "HIGH"

            explanations = []
            if rel >= 0.90:
                explanations.append("High reliability score & strong contract fulfillment record.")
            if p_ratio <= 0.90:
                explanations.append("Highly competitive bid pricing below target budget.")
            if deliv >= 0.90:
                explanations.append("Proven on-time delivery SLA compliance.")
            if rev >= 0.85:
                explanations.append("Top buyer historical ratings.")
            if not explanations:
                explanations.append("Meets standard procurement requirements.")

            decision_report = {
                "price_score": price_score,
                "reliability_score": reliability_score,
                "delivery_score": delivery_score,
                "history_score": history_score,
                "overall_risk": overall_risk
            }

            ranked_items.append({
                "rank": 0,
                "vendor_id": str(b["vendor_id"]),
                "name": str(b.get("name", b["vendor_id"])),
                "price": float(b["price"]),
                "ai_confidence": final_confidence,
                "decision_report": decision_report,
                "explanations": explanations
            })

        # Sort by highest AI confidence
        ranked_items.sort(key=lambda x: x["ai_confidence"], reverse=True)
        for rank_idx, item in enumerate(ranked_items, start=1):
            item["rank"] = rank_idx

        winner = ranked_items[0] if ranked_items else None

        return {
            "recommended_vendor": winner["name"] if winner else None,
            "confidence_percentage": winner["ai_confidence"] if winner else 0.0,
            "ranking_list": ranked_items,
            "decision_report": winner["decision_report"] if winner else None
        }

ai_engine = ProcurementAI()
