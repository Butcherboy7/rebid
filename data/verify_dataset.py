import os
import hashlib
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "csv")

def verify():
    print("=== DATASET VERIFICATION ===")
    
    # Load files
    vendors_df = pd.read_csv(os.path.join(DATA_DIR, "vendors.csv"))
    reqs_df = pd.read_csv(os.path.join(DATA_DIR, "procurement_requests.csv"))
    bids_df = pd.read_csv(os.path.join(DATA_DIR, "bids.csv"))
    fraud_df = pd.read_csv(os.path.join(DATA_DIR, "fraud_alerts.csv"))
    audit_df = pd.read_csv(os.path.join(DATA_DIR, "audit_trail.csv"))
    history_df = pd.read_csv(os.path.join(DATA_DIR, "procurement_history.csv"))
    
    print(f"Vendors: {len(vendors_df)} rows")
    print(f"Categories: {vendors_df['category'].nunique()} distinct categories")
    print(f"Procurement Requests: {len(reqs_df)} rows")
    print(f"Bids: {len(bids_df)} rows")
    print(f"Fraud Alerts: {len(fraud_df)} rows")
    print(f"Audit Logs: {len(audit_df)} rows")
    print(f"Unified Procurement History: {len(history_df)} rows\n")
    
    # Check stats
    print("Vendor historical rating distribution:")
    print(vendors_df["historical_rating"].describe().to_string())
    print("\nBid price vs budget distribution:")
    merged_bids = bids_df.merge(reqs_df, on="request_id")
    merged_bids["pct_of_budget"] = (merged_bids["bid_price"] / merged_bids["max_budget"]) * 100
    print(merged_bids["pct_of_budget"].describe().to_string())
    
    print("\nAI Recommendation Score distribution in Procurement History:")
    print(history_df["ai_recommendation_score"].describe().to_string())
    
    # Audit trail validation
    print("\nVerifying Cryptographic Audit Trail Hash Chain...")
    valid = True
    previous_hash = "0" * 64
    for idx, row in audit_df.iterrows():
        # Recreate hash
        data_to_hash = f"{row['log_id']}|{row['timestamp']}|{row['action']}|{row['payload']}|{row['previous_hash']}"
        expected_hash = hashlib.sha256(data_to_hash.encode("utf-8")).hexdigest()
        
        if row["previous_hash"] != previous_hash:
            print(f"[-] Audit Chain broken at row {idx}! Expected previous hash {previous_hash}, got {row['previous_hash']}.")
            valid = False
            break
            
        if row["hash"] != expected_hash:
            print(f"[-] Hash mismatch at row {idx}! Expected {expected_hash}, got {row['hash']}.")
            valid = False
            break
            
        previous_hash = row["hash"]
        
    if valid:
        print("[+] Tamper-Evident Audit Trail hash chain is 100% VALID and untampered!")
    else:
        print("[-] Audit Trail verification FAILED!")

if __name__ == "__main__":
    verify()
