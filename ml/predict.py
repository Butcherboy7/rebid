import os
import json
import numpy as np
import pandas as pd
from xgboost import XGBClassifier

ML_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(ML_DIR, "xgb_model.json")

class ProcurementAI:
    def __init__(self):
        self.model = XGBClassifier()
        if os.path.exists(MODEL_PATH):
            self.model.load_model(MODEL_PATH)
        else:
            self.model = None

    def evaluate_vendors(self, budget: float, bids: list, weights: dict):
        """
        bids: list of dicts with keys [vendor_id, name, price, reliability_score, delivery_score, historical_rating, defect_rate, avg_delay_days, completed_contracts]
        weights: dict with keys [cost, reliability, delivery, reviews] totaling 100
        """
        if not bids:
            return []

        features = []
        for b in bids:
            price_ratio = float(b["price"] / budget) if budget > 0 else 1.0
            features.append([
                price_ratio,
                float(b.get("reliability_score", 0.85)),
                float(b.get("delivery_score", 90.0)),
                float(b.get("historical_rating", 4.5)),
                float(b.get("defect_rate", 0.01)),
                float(b.get("avg_delay_days", 1.0)),
                float(b.get("completed_contracts", 50))
            ])

        X = np.array(features, dtype=np.float32)
        
        # Base XGBoost Probabilities
        if self.model:
            raw_preds = self.model.predict_proba(X)[:, 1]
            base_probs = [float(p) for p in raw_preds]
        else:
            base_probs = [0.5 for _ in range(len(bids))]

        w_cost = float(weights.get("cost", 40)) / 100.0
        w_rel = float(weights.get("reliability", 30)) / 100.0
        w_del = float(weights.get("delivery", 20)) / 100.0
        w_rev = float(weights.get("reviews", 10)) / 100.0

        results = []
        for idx, b in enumerate(bids):
            p_ratio = features[idx][0]
            rel = features[idx][1]
            deliv = features[idx][2] / 100.0
            rev = features[idx][3] / 5.0

            # Dynamic slider overlay score
            dynamic_utility = (
                w_cost * max(0.0, (1.0 - p_ratio)) +
                w_rel * rel +
                w_del * deliv +
                w_rev * rev
            )

            # Combined AI Score (60% XGBoost ML confidence + 40% Buyer Preference Overlay)
            final_confidence = (0.6 * base_probs[idx] + 0.4 * dynamic_utility) * 100.0
            final_confidence = round(float(min(99.4, max(45.0, final_confidence))), 1)

            explanations = []
            if rel >= 0.85:
                explanations.append("✓ Excellent vendor reliability & historical compliance")
            if p_ratio <= 0.85:
                explanations.append("✓ Competitive bid price below budget benchmark")
            if deliv >= 0.85:
                explanations.append("✓ On-time delivery SLA track record")
            if rev >= 0.8:
                explanations.append("✓ High buyer rating and positive verified reviews")
            if not explanations:
                explanations.append("✓ Satisfies core procurement threshold criteria")

            results.append({
                "vendor_id": str(b["vendor_id"]),
                "name": str(b.get("name", b["vendor_id"])),
                "price": float(b["price"]),
                "ai_confidence": float(final_confidence),
                "explanations": explanations,
                "xgb_raw_probability": round(float(base_probs[idx]), 3)
            })

        # Sort by highest confidence
        results.sort(key=lambda x: x["ai_confidence"], reverse=True)
        return results

ai_engine = ProcurementAI()
