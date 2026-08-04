import os
import json
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score

ML_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(ML_DIR, "..", "data", "csv", "dataset_10k.csv")
MODEL_PATH = os.path.join(ML_DIR, "xgb_model.json")

def train():
    print("Training XGBoost Procurement Recommendation Engine...")
    df = pd.read_csv(DATA_PATH)
    
    features = [
        "price_ratio", 
        "reliability_score", 
        "delivery_score", 
        "historical_rating", 
        "defect_rate", 
        "avg_delay_days", 
        "completed_contracts"
    ]
    
    X = df[features]
    y = df["is_winner"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    model = XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.08,
        eval_metric="logloss",
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, preds)
    auc = roc_auc_score(y_test, probs)
    
    print(f"Model Training Complete! Accuracy: {acc:.4f}, ROC-AUC: {auc:.4f}")
    
    model.save_model(MODEL_PATH)
    print(f"Saved XGBoost model to {MODEL_PATH}")

if __name__ == "__main__":
    train()
