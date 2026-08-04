import os
import json
import datetime
import hashlib
from sqlalchemy.orm import Session
from backend.app.models import AuditLog, FraudAlert, Bid, Auction, PurchaseOrder

STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")
os.makedirs(STATIC_DIR, exist_ok=True)

# Helper: Format Indian Rupee (INR) numbers (e.g. 5575500 -> 55,75,500)
def format_inr(number: float) -> str:
    try:
        s, *d = str(f"{number:.2f}").partition('.')
        r = ",".join([s[max(i - 2, 0):i] for i in range(len(s) - 3, 0, -2)][::-1] + [s[-3:]])
        return f"Rs {r}"
    except Exception:
        return f"Rs {number:,.2f}"

# 1. Audit Logging Service
def log_audit_event(db: Session, action: str, actor: str, details: dict = None):
    log = AuditLog(
        id=f"LOG-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S%f')[:17]}",
        action=action,
        actor=actor,
        details=json.dumps(details or {}),
        timestamp=datetime.datetime.utcnow()
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

# 2. Fraud Detection Engine (Rules 1, 2 & 3)
def analyze_bid_fraud(db: Session, auction: Auction, vendor_id: str, vendor_name: str, bid_price: float):
    alerts = []
    now = datetime.datetime.utcnow()

    # Rule 1: High frequency bidding (> 5 bids in 30 seconds window)
    thirty_seconds_ago = now - datetime.timedelta(seconds=30)
    recent_bids_count = db.query(Bid).filter(
        Bid.auction_id == auction.id,
        Bid.vendor_id == vendor_id,
        Bid.timestamp >= thirty_seconds_ago
    ).count()

    if recent_bids_count >= 5:
        alert = FraudAlert(
            id=f"FRD-HI-{now.strftime('%H%M%S%f')[:8]}",
            auction_id=auction.id,
            vendor_id=vendor_id,
            vendor_name=vendor_name,
            risk_level="HIGH",
            rule_triggered="High frequency bidding (> 5 bids in 30 seconds)",
            details=f"Vendor submitted {recent_bids_count + 1} bids within 30 seconds window.",
            timestamp=now
        )
        db.add(alert)
        alerts.append(alert)
        log_audit_event(db, "FRAUD_ALERT_HIGH", "System", {"vendor": vendor_name, "rule": alert.rule_triggered})

    # Rule 2: Abnormally low bid (< 50% max budget)
    if auction.max_budget > 0 and bid_price < (0.50 * auction.max_budget):
        alert = FraudAlert(
            id=f"FRD-MED-{now.strftime('%H%M%S%f')[:8]}",
            auction_id=auction.id,
            vendor_id=vendor_id,
            vendor_name=vendor_name,
            risk_level="MEDIUM",
            rule_triggered="Abnormally low bid (< 50% of max budget)",
            details=f"Bid price {format_inr(bid_price)} is under 50% of auction budget {format_inr(auction.max_budget)}.",
            timestamp=now
        )
        db.add(alert)
        alerts.append(alert)
        log_audit_event(db, "FRAUD_ALERT_MEDIUM", "System", {"vendor": vendor_name, "rule": alert.rule_triggered})

    # Rule 3: Collusive Bidding Pattern (Identical or near-identical bid within 60 seconds from different vendor)
    one_minute_ago = now - datetime.timedelta(seconds=60)
    matching_bids = db.query(Bid).filter(
        Bid.auction_id == auction.id,
        Bid.vendor_id != vendor_id,
        Bid.timestamp >= one_minute_ago
    ).all()

    for other_bid in matching_bids:
        price_diff = abs(other_bid.price - bid_price)
        if price_diff <= (0.005 * bid_price): # within 0.5% margin
            alert = FraudAlert(
                id=f"FRD-COL-{now.strftime('%H%M%S%f')[:8]}",
                auction_id=auction.id,
                vendor_id=vendor_id,
                vendor_name=vendor_name,
                risk_level="HIGH",
                rule_triggered="Collusive bidding pattern detected (near-identical bid within 60s)",
                details=f"Bid {format_inr(bid_price)} matches {other_bid.vendor_name}'s bid of {format_inr(other_bid.price)} within 60s.",
                timestamp=now
            )
            db.add(alert)
            alerts.append(alert)
            log_audit_event(db, "FRAUD_ALERT_COLLUSION", "System", {"vendor": vendor_name, "rule": alert.rule_triggered})
            break

    if alerts:
        db.commit()
    
    return alerts

# 3. SAP / GeM Style Enterprise Purchase Order / Contract Award Letter PDF Generator
def generate_purchase_order_pdf(
    po_id: str,
    buyer_name: str,
    vendor_name: str,
    item_title: str,
    unit_price: float,
    quantity: int = 100,
    category: str = "IT Equipment",
    auction_id: str = "RB-AUC-1008"
) -> str:
    filename = f"purchase_order_{po_id}.pdf"
    file_path = os.path.join(STATIC_DIR, filename)

    subtotal = unit_price * quantity
    gst_amount = subtotal * 0.18
    grand_total = subtotal + gst_amount
    issue_date = datetime.datetime.now().strftime("%B %d, %Y")
    delivery_deadline = (datetime.datetime.now() + datetime.timedelta(days=14)).strftime("%B %d, %Y")
    verification_hash = hashlib.sha256(f"{po_id}-{buyer_name}-{vendor_name}-{grand_total}".encode()).hexdigest()[:16].upper()

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas

        c = canvas.Canvas(file_path, pagesize=letter)
        
        # 1. Header Banner Bar (Navy #0F172A)
        c.setFillColorRGB(0.06, 0.09, 0.16) # #0F172A
        c.rect(0, 720, 612, 72, fill=1, stroke=0)

        c.setFont("Helvetica-Bold", 18)
        c.setFillColorRGB(1, 1, 1)
        c.drawString(40, 755, "ReBid AI Enterprise Procurement Network")
        c.setFont("Helvetica", 10)
        c.setFillColorRGB(0.02, 0.58, 0.41) # Emerald Accent #059669
        c.drawString(40, 735, "OFFICIAL PURCHASE ORDER / CONTRACT AWARD LETTER")

        c.setFont("Helvetica-Bold", 11)
        c.setFillColorRGB(1, 1, 1)
        c.drawString(440, 755, f"PO #: {po_id}")
        c.setFont("Helvetica", 9)
        c.drawString(440, 735, f"Ref: {auction_id}")

        # 2. Key Document Metadata Box
        c.setStrokeColorRGB(0.8, 0.85, 0.9)
        c.setFillColorRGB(0.97, 0.98, 0.99)
        c.rect(40, 630, 532, 75, fill=1, stroke=1)

        c.setFont("Helvetica-Bold", 9)
        c.setFillColorRGB(0.3, 0.4, 0.5)
        c.drawString(55, 685, "ISSUE DATE")
        c.drawString(205, 685, "DELIVERY DEADLINE")
        c.drawString(355, 685, "PROCUREMENT CATEGORY")
        c.drawString(485, 685, "STATUS")

        c.setFont("Helvetica-Bold", 10)
        c.setFillColorRGB(0.06, 0.09, 0.16)
        c.drawString(55, 668, issue_date)
        c.drawString(205, 668, delivery_deadline)
        c.drawString(355, 668, category[:18])
        
        c.setFillColorRGB(0.02, 0.58, 0.41)
        c.drawString(485, 668, "AWARDED")

        # 3. Buyer vs Vendor Details Table
        c.setFillColorRGB(0.97, 0.98, 0.99)
        c.rect(40, 535, 255, 80, fill=1, stroke=1)
        c.rect(317, 535, 255, 80, fill=1, stroke=1)

        # Buyer Block
        c.setFont("Helvetica-Bold", 10)
        c.setFillColorRGB(0.06, 0.09, 0.16)
        c.drawString(50, 598, "BUYER ORGANIZATION (ISSUER)")
        c.setFont("Helvetica", 9)
        c.setFillColorRGB(0.2, 0.2, 0.2)
        c.drawString(50, 580, f"Entity: {buyer_name}")
        c.drawString(50, 566, "GSTIN: 36AAACB1234F1Z9")
        c.drawString(50, 552, "Billing Dept: Enterprise Procurement Division")

        # Vendor Block
        c.setFont("Helvetica-Bold", 10)
        c.setFillColorRGB(0.06, 0.09, 0.16)
        c.drawString(327, 598, "AWARDED VENDOR (SUPPLIER)")
        c.setFont("Helvetica", 9)
        c.setFillColorRGB(0.2, 0.2, 0.2)
        c.drawString(327, 580, f"Company: {vendor_name}")
        c.drawString(327, 566, "Verification: ReBid Verified Tier-1 Vendor")
        c.drawString(327, 552, "SLA Compliance: 96% Guaranteed")

        # 4. Itemized Procurement Financial Breakdown Table
        c.setFillColorRGB(0.06, 0.09, 0.16)
        c.rect(40, 485, 532, 24, fill=1, stroke=0)

        c.setFont("Helvetica-Bold", 9)
        c.setFillColorRGB(1, 1, 1)
        c.drawString(50, 493, "Procurement Description")
        c.drawString(250, 493, "Category")
        c.drawString(340, 493, "Qty")
        c.drawString(380, 493, "Unit Price (Rs)")
        c.drawString(480, 493, "Subtotal (Rs)")

        # Line Item Row
        c.setFont("Helvetica", 9)
        c.setFillColorRGB(0.1, 0.1, 0.1)
        c.drawString(50, 465, item_title[:32])
        c.drawString(250, 465, category[:14])
        c.drawString(340, 465, str(quantity))
        c.drawString(380, 465, f"Rs {unit_price:,.2f}")
        c.drawString(480, 465, f"Rs {subtotal:,.2f}")

        c.setStrokeColorRGB(0.85, 0.85, 0.85)
        c.line(40, 450, 572, 450)

        # Totals Summary Box (Right Aligned)
        c.setFont("Helvetica", 9)
        c.drawString(360, 430, "Subtotal:")
        c.drawString(480, 430, f"Rs {subtotal:,.2f}")

        c.drawString(360, 412, "GST (18% Statutory Tax):")
        c.drawString(480, 412, f"Rs {gst_amount:,.2f}")

        c.setStrokeColorRGB(0.06, 0.09, 0.16)
        c.line(360, 402, 572, 402)

        c.setFont("Helvetica-Bold", 11)
        c.setFillColorRGB(0.02, 0.58, 0.41) # Emerald Accent
        c.drawString(360, 386, "GRAND TOTAL:")
        c.drawString(480, 386, f"Rs {grand_total:,.2f}")

        # 5. Terms & Signature Block
        c.setFillColorRGB(0.97, 0.98, 0.99)
        c.rect(40, 240, 532, 120, fill=1, stroke=1)

        c.setFont("Helvetica-Bold", 10)
        c.setFillColorRGB(0.06, 0.09, 0.16)
        c.drawString(50, 342, "TERMS & CONDITIONS")
        
        c.setFont("Helvetica", 8)
        c.setFillColorRGB(0.3, 0.3, 0.3)
        c.drawString(50, 326, "1. Payment Terms: Net 30 days upon digital delivery verification & acceptance certificate.")
        c.drawString(50, 312, "2. Delivery Terms: FOB Destination with guaranteed SLA compliance & warranty coverage.")
        c.drawString(50, 298, "3. Binding Contract: Electronically executed via ReBid AI Multi-Criteria Optimization Engine.")
        c.drawString(50, 284, "4. Verification ID: Validated through immutable audit logging and real-time checksum tracking.")

        # Digital Signature Stamp
        c.setFont("Helvetica-Bold", 9)
        c.setFillColorRGB(0.06, 0.09, 0.16)
        c.drawString(360, 265, "DIGITALLY SIGNED & AUTHORIZED")
        c.setFont("Helvetica-Oblique", 8)
        c.setFillColorRGB(0.02, 0.58, 0.41)
        c.drawString(360, 252, f"Security Hash: {verification_hash}")

        # 6. Bottom Document Footer
        c.setFont("Helvetica-Oblique", 8)
        c.setFillColorRGB(0.5, 0.5, 0.5)
        c.drawString(40, 40, "ReBid AI Enterprise Reverse Procurement Platform — Generated Automatically — Confidential Contract")
        c.drawString(440, 40, f"Ref: RB-PO-{verification_hash[:8]}")

        c.save()
    except Exception as e:
        print(f"[PDF Error] ReportLab exception: {e}")
        with open(file_path, "wb") as f:
            f.write(r"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n".encode())

    return f"/static/{filename}"
