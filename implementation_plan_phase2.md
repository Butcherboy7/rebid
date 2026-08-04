# Implementation Plan - Phase 2: Important Features & Scalability

Focuses on admin server-side dataset pagination, floating toast user feedback, collusive vendor fraud detection, and mobile viewport responsive adjustments.

---

## 🎯 Proposed Changes

### Component 1: Server-Side Dataset Pagination
#### [MODIFY] [main.py](file:///e:/rebid%20neha/backend/app/main.py)
#### [MODIFY] [AdminDashboard.jsx](file:///e:/rebid%20neha/frontend/src/pages/admin/AdminDashboard.jsx)
- **Changes**: Update `GET /api/admin/vendors` endpoint to accept `page`, `limit`, and `search` query parameters using SQLAlchemy `offset()` and `limit()`. Update `AdminDashboard.jsx` to render pagination controls (`Previous`, `Page X of Y`, `Next`) and live search input.

---

### Component 2: Floating Toast Notification Stack
#### [MODIFY] [VendorDashboard.jsx](file:///e:/rebid%20neha/frontend/src/pages/vendor/VendorDashboard.jsx)
#### [MODIFY] [BuyerDashboard.jsx](file:///e:/rebid%20neha/frontend/src/pages/buyer/BuyerDashboard.jsx)
- **Changes**: Implement a top-right floating toast notification component (`ToastContext` or lightweight toast container). Triggers crisp animated toasts for actions: `"Bid submitted successfully!"`, `"Switched company account to HP"`, `"Contract awarded to Dell"`.

---

### Component 3: Collusive Vendor Fraud Detection (Rule 3)
#### [MODIFY] [services.py](file:///e:/rebid%20neha/backend/app/services.py)
- **Changes**: Add Rule 3 to `analyze_bid_fraud()`: Inspects whether 2 or more distinct vendor accounts submit identical or near-identical bid prices (within 0.5% margin) within a 60-second window. Triggers `HIGH` risk `FRD-COLLUSION` alert.

---

### Component 4: Mobile Viewport Alignment (< 360px)
#### [MODIFY] [index.css](file:///e:/rebid%20neha/frontend/src/index.css)
#### [MODIFY] [VendorDashboard.jsx](file:///e:/rebid%20neha/frontend/src/pages/vendor/VendorDashboard.jsx)
- **Changes**: Adjust Account Switcher Dropdown positioning to `right: 0` with `max-width: 90vw` on viewports `< 360px`. Add flex-wrapping to create procurement modal sliders.

---

## 🧪 Verification Plan

### Automated Verification
- Run `scratch/test_backend.py` with added pagination parameters (`?page=1&limit=25`) and collusion bid triggers.

### Manual Verification
- Test Admin Pagination: Open Admin Portal -> Search "Steel" -> Verify server returns paginated results and page count.
- Test Toast Notifications: Submit counter-bid -> Verify top-right floating toast appears and auto-dismisses after 3 seconds.
