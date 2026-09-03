"""
Generates placeholder verification-document PDFs (GST certificate, incorporation
certificate, signatory ID, bank proof) for the seeded demo vendor accounts, and
attaches them as approved UserDocument rows so the admin/buyer document-review
UI has real files to open instead of empty states.

Run manually:
    venv/Scripts/python.exe -m backend.scripts.generate_demo_certs

These are clearly-marked specimens for demo/screenshot purposes only.
"""
import os
import sys
import uuid
import datetime

sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas

from backend.app.database import SessionLocal
from backend.app.models import User, UserDocument

NAVY = HexColor("#0F172A")
GREEN = HexColor("#059669")
SLATE = HexColor("#475569")
LIGHT = HexColor("#F8FAFC")
BORDER = HexColor("#CBD5E1")

CERTS_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "certs")
os.makedirs(CERTS_DIR, exist_ok=True)


def _frame(c, title, subtitle):
    w, h = A4
    c.setFillColor(NAVY)
    c.rect(0, h - 28 * mm, w, 28 * mm, fill=1, stroke=0)
    c.setFillColor(HexColor("#FFFFFF"))
    c.setFont("Helvetica-Bold", 16)
    c.drawString(18 * mm, h - 14 * mm, title)
    c.setFont("Helvetica", 9)
    c.setFillColor(HexColor("#94A3B8"))
    c.drawString(18 * mm, h - 21 * mm, subtitle)

    c.setStrokeColor(BORDER)
    c.setLineWidth(1)
    c.rect(10 * mm, 10 * mm, w - 20 * mm, h - 42 * mm, stroke=1, fill=0)

    c.setFillColor(HexColor("#94A3B8"))
    c.setFont("Helvetica", 6.5)
    c.drawCentredString(w / 2, 6 * mm,
                         "Specimen document generated for platform demonstration purposes only — not a valid legal instrument.")


def _field(c, x, y, label, value):
    c.setFont("Helvetica", 8)
    c.setFillColor(SLATE)
    c.drawString(x, y, label.upper())
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(NAVY)
    c.drawString(x, y - 5.5 * mm, str(value))


def _seal(c, x, y, text_lines):
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.4)
    c.circle(x, y, 16 * mm, stroke=1, fill=0)
    c.circle(x, y, 13.5 * mm, stroke=1, fill=0)
    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 6.5)
    for i, line in enumerate(text_lines):
        c.drawCentredString(x, y + 3 * mm - (i * 3.2 * mm), line)


def gst_certificate(path, acc):
    c = canvas.Canvas(path, pagesize=A4)
    w, h = A4
    _frame(c, "GOODS & SERVICES TAX — REGISTRATION CERTIFICATE", "Form GST REG-06 · Government of India · Specimen")

    y = h - 45 * mm
    _field(c, 20 * mm, y, "Legal Name of Business", acc.get("company_name"))
    y -= 16 * mm
    _field(c, 20 * mm, y, "GSTIN", acc.get("gst_number"))
    y -= 16 * mm
    _field(c, 20 * mm, y, "Constitution of Business", acc.get("org_type"))
    y -= 16 * mm
    _field(c, 20 * mm, y, "Principal Place of Business", acc.get("registered_address"))
    y -= 16 * mm
    _field(c, 20 * mm, y, "Date of Registration", "01/04/2015")
    y -= 16 * mm
    _field(c, 20 * mm, y, "Authorized Signatory", f"{acc.get('rep_name')} ({acc.get('rep_designation')})")

    _seal(c, w - 42 * mm, 45 * mm, ["GST", "VERIFIED", "SPECIMEN"])
    c.save()


def incorporation_certificate(path, acc):
    c = canvas.Canvas(path, pagesize=A4)
    w, h = A4
    _frame(c, "CERTIFICATE OF INCORPORATION", "Ministry of Corporate Affairs · Ref: MCA21 · Specimen")

    y = h - 45 * mm
    _field(c, 20 * mm, y, "Company Name", acc.get("company_name"))
    y -= 16 * mm
    _field(c, 20 * mm, y, "Corporate Identity Number (CIN)", acc.get("cin") or "N/A")
    y -= 16 * mm
    _field(c, 20 * mm, y, "PAN", acc.get("pan_number"))
    y -= 16 * mm
    _field(c, 20 * mm, y, "Class of Company", acc.get("org_type"))
    y -= 16 * mm
    _field(c, 20 * mm, y, "Years in Business", f"{acc.get('years_in_business')} years")
    y -= 16 * mm
    _field(c, 20 * mm, y, "Registered Office Address", acc.get("registered_address"))

    c.setFont("Helvetica-Oblique", 9)
    c.setFillColor(SLATE)
    c.drawString(20 * mm, 55 * mm,
                 "I hereby certify that the above-named entity is incorporated under the")
    c.drawString(20 * mm, 50 * mm, "Companies Act and is a legal entity under the said Act.")

    _seal(c, w - 42 * mm, 45 * mm, ["MCA", "REGISTRAR", "SPECIMEN"])
    c.save()


def signatory_id(path, acc):
    c = canvas.Canvas(path, pagesize=A4)
    w, h = A4
    _frame(c, "AUTHORIZED SIGNATORY — IDENTITY VERIFICATION", "PAN Card Reference · Specimen")

    y = h - 45 * mm
    _field(c, 20 * mm, y, "Name", acc.get("rep_name"))
    y -= 16 * mm
    _field(c, 20 * mm, y, "Designation", acc.get("rep_designation"))
    y -= 16 * mm
    _field(c, 20 * mm, y, "Permanent Account Number (PAN)", acc.get("pan_number"))
    y -= 16 * mm
    _field(c, 20 * mm, y, "Organization", acc.get("company_name"))
    y -= 16 * mm
    _field(c, 20 * mm, y, "Contact Email", acc.get("rep_email"))
    y -= 16 * mm
    _field(c, 20 * mm, y, "Contact Phone", acc.get("rep_phone"))

    _seal(c, w - 42 * mm, 45 * mm, ["ID", "VERIFIED", "SPECIMEN"])
    c.save()


def bank_proof(path, acc):
    c = canvas.Canvas(path, pagesize=A4)
    w, h = A4
    _frame(c, "BANK ACCOUNT VERIFICATION LETTER", f"{acc.get('bank_name')} · Specimen")

    y = h - 45 * mm
    _field(c, 20 * mm, y, "Account Holder Name", acc.get("bank_account_name"))
    y -= 16 * mm
    _field(c, 20 * mm, y, "Bank Name", acc.get("bank_name"))
    y -= 16 * mm
    _field(c, 20 * mm, y, "Account Number", acc.get("bank_account_number"))
    y -= 16 * mm
    _field(c, 20 * mm, y, "IFSC Code", acc.get("bank_ifsc"))
    y -= 16 * mm
    _field(c, 20 * mm, y, "UPI Handle", acc.get("bank_upi"))
    y -= 16 * mm
    _field(c, 20 * mm, y, "Branch Address", acc.get("registered_address"))

    _seal(c, w - 42 * mm, 45 * mm, ["BANK", "VERIFIED", "SPECIMEN"])
    c.save()


DOC_BUILDERS = {
    "tax_id": gst_certificate,
    "certification": incorporation_certificate,
    "signatory_id": signatory_id,
    "business_license": incorporation_certificate,
    "bank_info": bank_proof,
}


def main():
    db = SessionLocal()
    try:
        # Pull the same demo account roster main.py seeds, by re-deriving from DB
        # (main.py has already run its startup seeding by the time this script is invoked).
        users = db.query(User).filter(User.role.in_(["VENDOR", "BUYER"])).all()
        created = 0
        for user in users:
            acc = {
                "company_name": user.company_name or user.name,
                "gst_number": user.gst_number,
                "pan_number": user.pan_number,
                "cin": user.cin,
                "org_type": user.org_type,
                "years_in_business": user.years_in_business,
                "registered_address": user.registered_address,
                "rep_name": user.rep_name,
                "rep_designation": user.rep_designation,
                "rep_email": user.rep_email,
                "rep_phone": user.rep_phone,
                "bank_account_name": user.bank_account_name,
                "bank_name": user.bank_name,
                "bank_account_number": user.bank_account_number,
                "bank_ifsc": user.bank_ifsc,
                "bank_upi": user.bank_upi,
            }
            if not acc["gst_number"]:
                continue  # skip accounts without seeded compliance data (e.g. admin)

            user_dir = os.path.join(CERTS_DIR, user.id)
            os.makedirs(user_dir, exist_ok=True)

            for doc_type, builder in DOC_BUILDERS.items():
                existing = db.query(UserDocument).filter(
                    UserDocument.user_id == user.id,
                    UserDocument.doc_type == doc_type
                ).first()
                if existing:
                    continue

                filename = f"{doc_type}.pdf"
                filepath = os.path.join(user_dir, filename)
                builder(filepath, acc)

                file_url = f"/static/certs/{user.id}/{filename}"
                doc = UserDocument(
                    id=f"doc_{uuid.uuid4().hex[:10]}",
                    user_id=user.id,
                    doc_type=doc_type,
                    file_url=file_url,
                    status="approved",
                    uploaded_at=datetime.datetime.utcnow(),
                    reviewed_at=datetime.datetime.utcnow(),
                    reviewed_by="usr_admin"
                )
                db.add(doc)
                created += 1

        db.commit()
        print(f"[generate_demo_certs] Created {created} document records for {len(users)} users.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
