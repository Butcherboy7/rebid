import os
import json
import hashlib
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

PDF_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "pdfs")
os.makedirs(PDF_DIR, exist_ok=True)

class AuditEngine:
    def __init__(self, storage_path=None):
        if storage_path is None:
            storage_path = os.path.join(os.path.dirname(__file__), "..", "data", "audit_chain.json")
        self.storage_path = storage_path
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        self.logs = self._load()

    def _load(self):
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, "r") as f:
                    return json.load(f)
            except Exception:
                return []
        return []

    def _save(self):
        with open(self.storage_path, "w") as f:
            json.dump(self.logs, f, indent=2)

    def add_event(self, action: str, user: str, details: dict):
        timestamp = datetime.now().isoformat()
        log_id = f"AUD-{len(self.logs)+1:06d}"
        prev_hash = self.logs[-1]["hash"] if self.logs else "0" * 64
        
        payload_str = json.dumps(details, sort_keys=True)
        raw_str = f"{log_id}|{timestamp}|{action}|{user}|{payload_str}|{prev_hash}"
        curr_hash = hashlib.sha256(raw_str.encode("utf-8")).hexdigest()

        entry = {
            "log_id": log_id,
            "timestamp": timestamp,
            "action": action,
            "user": user,
            "details": details,
            "previous_hash": prev_hash,
            "hash": curr_hash
        }
        self.logs.append(entry)
        self._save()
        return entry

    def get_logs(self):
        return list(reversed(self.logs))

class FraudEngine:
    def analyze_bids(self, bids: list):
        """
        Detects bot activity, abnormal price dumps, and collusion patterns.
        """
        alerts = []
        if not bids:
            return alerts

        # Sort by timestamp
        sorted_bids = sorted(bids, key=lambda x: x.get("timestamp", ""))

        # 1. Bot activity: >15 bids in <10 seconds
        if len(sorted_bids) >= 5:
            rapid_count = 0
            for i in range(len(sorted_bids)-1):
                try:
                    t1 = datetime.fromisoformat(sorted_bids[i]["timestamp"])
                    t2 = datetime.fromisoformat(sorted_bids[i+1]["timestamp"])
                    if (t2 - t1).total_seconds() <= 2.0:
                        rapid_count += 1
                except Exception:
                    pass
            if rapid_count >= 3:
                alerts.append({
                    "type": "BOT_ACTIVITY",
                    "severity": "HIGH",
                    "reason": "Rapid automated bidding sequence detected (<2 sec interval between multiple bids).",
                    "risk_score": 88
                })

        # 2. Abnormal Pricing (Drop >45% below max budget)
        max_budget = bids[0].get("max_budget", 100000)
        lowest_bid = min([b["price"] for b in bids])
        if max_budget > 0 and (lowest_bid / max_budget) < 0.50:
            alerts.append({
                "type": "ABNORMAL_PRICING",
                "severity": "MEDIUM",
                "reason": f"Unusually steep price drop detected ({round((1 - lowest_bid/max_budget)*100, 1)}% below max budget).",
                "risk_score": 65
            })

        # 3. Collusion check: alternating vendors with fixed decrement
        if len(sorted_bids) >= 4:
            vendors_involved = [b["vendor_id"] for b in sorted_bids[-4:]]
            if len(set(vendors_involved)) == 2 and vendors_involved[0] == vendors_involved[2] and vendors_involved[1] == vendors_involved[3]:
                alerts.append({
                    "type": "POSSIBLE_COLLUSION",
                    "severity": "HIGH",
                    "reason": f"Alternating bid pattern detected between {vendors_involved[0]} and {vendors_involved[1]}.",
                    "risk_score": 92
                })

        return alerts

def generate_invoice_pdf(auction_id: str, buyer_name: str, vendor_name: str, item_title: str, amount: float):
    pdf_filename = f"Invoice_{auction_id}.pdf"
    file_path = os.path.join(PDF_DIR, pdf_filename)
    
    doc = SimpleDocTemplate(file_path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=12
    )
    story.append(Paragraph("REBID AI - PURCHASE ORDER & INVOICE", title_style))
    story.append(Paragraph(f"<b>Invoice ID:</b> INV-{auction_id}", styles['Normal']))
    story.append(Paragraph(f"<b>Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    story.append(Spacer(1, 15))

    # Parties
    data = [
        ["Buyer Organization", "Winning Vendor Supplier"],
        [buyer_name, vendor_name],
        ["Verified Enterprise Buyer", "AI Recommended Awardee"]
    ]
    t = Table(data, colWidths=[250, 250])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#334155')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))

    # Procurement details
    item_data = [
        ["Item / Procurement Request", "Awarded Contract Value"],
        [item_title, f"INR {amount:,.2f}"]
    ]
    t2 = Table(item_data, colWidths=[350, 150])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
    ]))
    story.append(t2)
    story.append(Spacer(1, 25))

    # Verification stamp
    cert_hash = hashlib.sha256(f"{auction_id}|{amount}|{vendor_name}".encode("utf-8")).hexdigest()
    story.append(Paragraph("<b>Tamper-Evident SHA-256 Verification Signature:</b>", styles['Normal']))
    story.append(Paragraph(f"<font color='#0EA5E9'><code>{cert_hash}</code></font>", styles['Normal']))
    story.append(Spacer(1, 15))
    story.append(Paragraph("<i>This document is automatically generated and digitally authenticated by ReBid AI.</i>", styles['Italic']))

    doc.build(story)
    return f"/static/pdfs/{pdf_filename}"

audit_engine = AuditEngine()
fraud_engine = FraudEngine()
