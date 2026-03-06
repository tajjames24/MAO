# PRD — Wholesale Offer Calculator

## Overview
A quick deal analyzer for real estate wholesalers to calculate maximum offer prices in under 60 seconds.

**App URL:** https://mao-finder.preview.emergentagent.com

---

## Architecture
- **Frontend:** React (single-page, no backend needed)
- **Storage:** localStorage for saved deals
- **Fonts:** Chivo (numbers/headings) + Inter (body) via Google Fonts
- **Libraries:** jsPDF (PDF export), sonner (toasts), lucide-react (icons)

---

## Core Formulas Implemented
| Formula | Calculation |
|---|---|
| 70% Rule | ARV × ARV Rule % |
| MAO (hero) | (ARV × ARV Rule %) − Repair Cost − Assignment Fee |
| Buyer Max Price | MAO + Assignment Fee |
| First Offer | MAO − (MAO × Negotiation Discount %) |
| Investor Profit | ARV − MAO − Repair Cost |

---

## User Persona
Real estate wholesalers who need to quickly analyze deals and determine maximum offer prices while leaving room for assignment fees and investor profit.

---

## What's Been Implemented (Feb 2026)
- [x] Core calculator with 3 primary inputs (ARV, Repair Cost, Assignment Fee)
- [x] Advanced Options panel (collapsible) — ARV Rule % slider (60–85%), Negotiation Discount
- [x] Auto-calculated results: 70% Rule, MAO (hero), First Offer, Buyer Max Price, Assignment Fee, Investor Profit
- [x] Deal Score Indicator — Green (Excellent), Yellow (Average), Red (Bad) with auto-grading
- [x] Investor % of ARV displayed alongside deal score
- [x] Save Deal to localStorage with custom name
- [x] Saved Deals modal — view, browse, delete
- [x] Export as PDF (jsPDF — orange-branded professional layout)
- [x] Copy to Clipboard — formatted text summary
- [x] Reset Calculator button
- [x] Mobile responsive 2-col (desktop) / stacked (mobile) layout
- [x] Orange #FF7A00 theme, Light Orange #FFE6CC inputs, Chivo font for numbers
- [x] Hard shadow brutalist card design per design guidelines
- [x] Deal Score Guide legend visible on results panel

---

## Deal Score Logic
| Score | Condition |
|---|---|
| Green — Excellent | Investor Profit ≥ 25% of ARV AND Repair Cost ≤ 25% of ARV |
| Yellow — Average | Investor Profit ≥ 15% of ARV AND Repair Cost ≤ 40% of ARV |
| Red — Bad | Otherwise (including negative MAO) |

---

## Prioritized Backlog

### P0 (Complete)
- All calculator formulas
- Deal score indicator
- Save/Export/Copy features

### P1 (Future)
- Deal comparison view (side-by-side multiple deals)
- Share deal via URL (encode inputs in query params)
- Deal history chart (profit trend over saved deals)

### P2 (Nice to have)
- Email deal summary
- Import deals from CSV
- Market comps integration

---

## Test Results (Feb 2026)
- Frontend: 100% pass rate
- Verified: ARV=300k, RC=30k, AF=10k → MAO=$170,000, FirstOffer=$153,000, BuyerPrice=$180,000, InvestorProfit=$100,000, Score=Excellent
